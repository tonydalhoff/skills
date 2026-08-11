#!/usr/bin/env node
// Ground-truth trace-fidelity audit: verifies that every requirement's
// declared `⇒ file :: "title"` trace corresponds to a testcase that actually
// ran, per a JUnit XML report — not just a string that appears in source.
// Catches skipped/todo tests, titles that never executed, and titles that
// only exist in a describe-block variant that never matched.
//
// This is a periodic, execution-dependent audit — run it against a fresh
// test run's JUnit output, not on every commit (see check-traces.mjs in the
// trace-requirements skill for the lightweight per-commit gate).
//
// Also reports two requirement smells that only ground truth can see:
//   - fan-out: a requirement ID with more than 3 executed testcases. Often
//     means the requirement is too coarse (should be split), OR a single
//     declared trace exploded via it.each/test.each parametrization —
//     itself a signal that the loop's conditions should be explicit
//     requirements rather than implicit test-data variants.
//   - untraced tests: testcases with no requirement-ID prefix at all, which
//     usually means undocumented behavior is under test.
//
// Usage: node audit-traces.mjs <junit-report.xml> [--doc <requirements.md>]
//        [--fan-out-threshold <n>] [--untraced-threshold <pct>]
// --doc defaults to REQUIREMENTS.md at the repo root (the trace-requirements
// skill's convention).
// Exit codes: 0 = all accepted requirements' traces resolved to real,
// passing, non-skipped testcases; 1 = one or more did not; 2 = usage/parse error.

import { readFileSync } from 'node:fs';

const rawArgs = process.argv.slice(2);
const numericFlags = { '--fan-out-threshold': 3, '--untraced-threshold': 20 };
const docIdx = rawArgs.indexOf('--doc');
const docPath = docIdx >= 0 ? rawArgs[docIdx + 1] : 'REQUIREMENTS.md';
const positional = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--doc') {
    i++;
  } else if (a in numericFlags) {
    numericFlags[a] = Number(rawArgs[++i]);
  } else {
    positional.push(a);
  }
}
const fanOutThreshold = numericFlags['--fan-out-threshold'];
const untracedThreshold = numericFlags['--untraced-threshold'];
const [junitPath] = positional;
if (!junitPath) {
  console.error(
    'Usage: audit-traces.mjs <junit-report.xml> [--doc <requirements.md>] [--fan-out-threshold <n>] [--untraced-threshold <pct>]',
  );
  process.exit(2);
}

let doc;
try {
  doc = readFileSync(docPath, 'utf8');
} catch {
  console.error(`Requirements doc not found: ${docPath}${docIdx < 0 ? ' (default — pass --doc <path> if it lives elsewhere)' : ''}`);
  process.exit(2);
}

const reqHeaderRe = /(~~)?\*\*([A-Z]{2,6}-\d+(?:\.\d+)*)(\s*\[PROPOSED\])?\*\*/;
const traceLineRe = /⇒\s*`([^`]+?)\s*::\s*"([^"]+)"`/;

const reqs = new Map();
let currentId = null;
for (const line of doc.split('\n')) {
  const header = line.match(reqHeaderRe);
  if (header) {
    const [, dropped, id, proposedTag] = header;
    currentId = dropped ? null : id;
    if (currentId && !reqs.has(currentId)) reqs.set(currentId, { proposed: Boolean(proposedTag), traces: [] });
    continue;
  }
  const trace = line.match(traceLineRe);
  if (trace && currentId) {
    const [, file, title] = trace;
    reqs.get(currentId).traces.push({ file: file.trim(), title });
  }
}
if (reqs.size === 0) {
  console.error(`No requirement IDs found in ${docPath}`);
  process.exit(2);
}

const xml = readFileSync(junitPath, 'utf8');

const unescapeXml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&');

const testcaseRe = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
const nameAttrRe = /\bname="([^"]*)"/;

const testcases = [];
for (const m of xml.matchAll(testcaseRe)) {
  const attrs = m[1];
  const body = m[3] ?? '';
  const nameMatch = attrs.match(nameAttrRe);
  if (!nameMatch) continue;
  const name = unescapeXml(nameMatch[1]);
  let status = 'passed';
  if (/<skipped\b/.test(body)) status = 'skipped';
  else if (/<failure\b|<error\b/.test(body)) status = 'failed';
  testcases.push({ name, status });
}
if (testcases.length === 0) {
  console.error(`No <testcase> elements found in ${junitPath}`);
  process.exit(2);
}

const missingAccepted = [];
const brokenAccepted = [];
const missingProposed = [];
const brokenProposed = [];

for (const [id, { proposed, traces }] of reqs) {
  if (traces.length === 0) {
    (proposed ? missingProposed : missingAccepted).push(id);
    continue;
  }
  const problems = [];
  for (const { file, title } of traces) {
    const match = testcases.find((tc) => tc.name.includes(title));
    if (!match) problems.push(`${file}: no executed testcase matches "${title}"`);
    else if (match.status === 'skipped') problems.push(`${file}: "${title}" was skipped, not run`);
    else if (match.status === 'failed') problems.push(`${file}: "${title}" failed`);
  }
  if (problems.length) (proposed ? brokenProposed : brokenAccepted).push({ id, problems });
}

// Smell: realized fan-out. Group executed testcases by requirement-ID
// prefix (post any it.each/test.each expansion) regardless of what the doc
// declares, since parametrization can multiply one declared trace into many
// real testcases.
const idPrefixRe = /(?:^|[\s>])([A-Z]{2,6}-\d+(?:\.\d+)*):/;
const byId = new Map();
for (const tc of testcases) {
  const m = tc.name.match(idPrefixRe);
  if (!m) continue;
  const id = m[1];
  if (!byId.has(id)) byId.set(id, []);
  byId.get(id).push(tc.name);
}
const fannedOut = [...byId.entries()].filter(([, names]) => names.length > fanOutThreshold);
if (fannedOut.length) {
  console.warn(`warning: requirement fan-out exceeds ${fanOutThreshold} testcases — consider splitting or extracting explicit sub-requirements:`);
  for (const [id, names] of fannedOut) console.warn(`  - ${id}: ${names.length} testcases`);
}

// Smell: untraced tests. A high count/ratio usually means behavior is under
// test but undocumented in requirements.md.
const untracedTests = testcases.filter((tc) => !idPrefixRe.test(tc.name));
const untracedPct = Math.round((untracedTests.length / testcases.length) * 1000) / 10;

console.log(`Requirement smell — untraced tests: ${untracedTests.length}/${testcases.length} (${untracedPct}%)`);
if (untracedPct > untracedThreshold) {
  console.warn(
    `warning: untraced-test ratio ${untracedPct}% exceeds ${untracedThreshold}% threshold — review these for missing requirements:`,
  );
  for (const tc of untracedTests.slice(0, 20)) console.warn(`  - ${tc.name}`);
  if (untracedTests.length > 20) console.warn(`  ...and ${untracedTests.length - 20} more`);
}

if (missingProposed.length)
  console.warn(`warning: untraced [PROPOSED] requirements: ${missingProposed.join(', ')}`);
if (brokenProposed.length)
  for (const { id, problems } of brokenProposed)
    console.warn(`warning: [PROPOSED] ${id} has unresolved trace(s): ${problems.join('; ')}`);

const failingAccepted = [...missingAccepted, ...brokenAccepted.map((b) => b.id)];
if (failingAccepted.length) {
  for (const { id, problems } of brokenAccepted)
    console.error(`FAIL: ${id} has trace(s) that did not resolve to a real, passing test: ${problems.join('; ')}`);
  if (missingAccepted.length) console.error(`FAIL: no trace line for: ${missingAccepted.join(', ')}`);
  process.exit(1);
}
const tracedCount = reqs.size - failingAccepted.length - missingProposed.length - brokenProposed.length;
console.log(`OK: ${reqs.size} requirements, ${tracedCount} traced to real executed tests.`);
