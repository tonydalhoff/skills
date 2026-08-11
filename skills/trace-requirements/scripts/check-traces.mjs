#!/usr/bin/env node
// Verify that every requirement's declared trace line(s) resolve to a real
// test title, verbatim, in the named file. A requirement is traced only if
// each of its `⇒ file :: "title"` lines points at a file that exists and
// contains that exact quoted title — matching the ID prefix alone is not
// enough (a requirement whose test title has drifted from the doc must fail).
//
// This is the lightweight, static, per-commit gate: it never executes tests,
// so it cannot tell a real test from a skipped/todo one with a matching
// title. For that ground-truth check, run audit-traces.mjs against a test
// run's JUnit report as a periodic deep audit, not on every push.
//
// Usage: node check-traces.mjs [--doc <requirements.md>] <tests-dir> [<tests-dir>...]
// --doc defaults to REQUIREMENTS.md at the repo root (the skill's
// convention, same discoverability pattern as AGENTS.md/README.md).
// Exit codes: 0 = all accepted requirements traced; 1 = untraced or broken
// traces on accepted requirements; 2 = usage/parse error.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';

const rawArgs = process.argv.slice(2);
const progress = rawArgs.includes('--progress');
const docIdx = rawArgs.indexOf('--doc');
const docPath = docIdx >= 0 ? rawArgs[docIdx + 1] : 'REQUIREMENTS.md';
const testDirs = rawArgs.filter((a, i) => a !== '--progress' && a !== '--doc' && (docIdx < 0 || i !== docIdx + 1));
if (testDirs.length === 0) {
  console.error('Usage: check-traces.mjs [--doc <requirements.md>] <tests-dir>...');
  process.exit(2);
}

let doc;
try {
  doc = readFileSync(docPath, 'utf8');
} catch {
  console.error(`Requirements doc not found: ${docPath}${docIdx < 0 ? ' (default — pass --doc <path> if it lives elsewhere)' : ''}`);
  process.exit(2);
}
const docDir = dirname(resolve(docPath));

// Matches `**SCR-2**`, `**DFT-4.1 [PROPOSED]**`; ignores struck-through IDs.
const reqHeaderRe = /(~~)?\*\*([A-Z]{2,6}-\d+(?:\.\d+)*)(\s*\[PROPOSED\])?\*\*/;
// Matches `⇒ \`path/to/file.test.ts :: "ID: title text"\``
const traceLineRe = /⇒\s*`([^`]+?)\s*::\s*"([^"]+)"`/;

const reqs = new Map(); // id -> { proposed, dropped, traces: [{file, title}] }
let currentId = null;
for (const line of doc.split('\n')) {
  const header = line.match(reqHeaderRe);
  if (header) {
    const [, dropped, id, proposedTag] = header;
    currentId = dropped ? null : id;
    if (currentId && !reqs.has(currentId)) {
      reqs.set(currentId, { proposed: Boolean(proposedTag), traces: [] });
    }
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

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.rs', '.java', '.rb']);
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (exts.has(extname(name))) files.push(p);
  }
};
for (const dir of testDirs) {
  try {
    statSync(dir);
  } catch {
    console.error(`Tests directory not found: ${dir}`);
    process.exit(2);
  }
  walk(dir);
}

const fileContentCache = new Map();
const readCached = (path) => {
  if (fileContentCache.has(path)) return fileContentCache.get(path);
  let content = null;
  try {
    content = readFileSync(resolve(docDir, path), 'utf8');
  } catch {
    try {
      content = readFileSync(resolve(path), 'utf8');
    } catch {
      content = null;
    }
  }
  fileContentCache.set(path, content);
  return content;
};

const containsTitle = (content, title) =>
  content.includes(`"${title}"`) || content.includes(`'${title}'`) || content.includes('`' + title + '`');

const missingAccepted = []; // no trace line at all
const brokenAccepted = []; // trace line(s) present but unresolved
const missingProposed = [];
const brokenProposed = [];

for (const [id, { proposed, traces }] of reqs) {
  if (traces.length === 0) {
    (proposed ? missingProposed : missingAccepted).push(id);
    continue;
  }
  const problems = [];
  for (const { file, title } of traces) {
    const content = readCached(file);
    if (content === null) problems.push(`${file}: file not found`);
    else if (!containsTitle(content, title)) problems.push(`${file}: title not found: "${title}"`);
  }
  if (problems.length) (proposed ? brokenProposed : brokenAccepted).push({ id, problems });
}

// Cross-check: titles that look like `"ID: ..."` in test files but don't
// match any trace line the doc declares for that ID. Two distinct failure
// shapes: the ID is entirely absent from the doc (orphan), or the ID exists
// but with a different title than any declared trace (drift — a test whose
// title diverged from the doc's normative text, or vice versa).
const corpus = files.map((f) => ({ file: f, content: readFileSync(f, 'utf8') }));
const titleRe = /["'`]([A-Z]{2,6}-\d+(?:\.\d+)*):[^"'`]*["'`]/g;
const orphans = new Set();
const drifted = [];
for (const { file, content } of corpus) {
  for (const m of content.matchAll(titleRe)) {
    const id = m[1];
    const found = m[0].slice(1, -1); // strip surrounding quote chars
    if (!reqs.has(id)) {
      orphans.add(id);
      continue;
    }
    const { traces } = reqs.get(id);
    if (traces.length && !traces.some((t) => t.title === found)) {
      drifted.push({ id, file, found, declared: traces.map((t) => t.title) });
    }
  }
}

if (missingProposed.length)
  console.warn(`warning: untraced [PROPOSED] requirements: ${missingProposed.join(', ')}`);
if (brokenProposed.length)
  for (const { id, problems } of brokenProposed)
    console.warn(`warning: [PROPOSED] ${id} has unresolved trace(s): ${problems.join('; ')}`);
if (orphans.size)
  console.warn(`warning: test IDs missing from doc: ${[...orphans].join(', ')}`);
for (const { id, file, found, declared } of drifted) {
  console.warn(
    `warning: ${id} title drift in ${file}: test uses "${found}" but doc declares ${declared.map((t) => `"${t}"`).join(' / ')}`,
  );
}

const failingAccepted = [...missingAccepted, ...brokenAccepted.map((b) => b.id)];
if (failingAccepted.length) {
  for (const { id, problems } of brokenAccepted) console.error(`FAIL: ${id} has unresolved trace(s): ${problems.join('; ')}`);
  if (missingAccepted.length) console.error(`FAIL: no trace line for: ${missingAccepted.join(', ')}`);

  if (progress) {
    const acceptedTotal = [...reqs.values()].filter((r) => !r.proposed).length;
    const acceptedTraced = acceptedTotal - failingAccepted.length;
    console.log(
      `progress: ${acceptedTraced}/${acceptedTotal} accepted requirements traced; untraced: ${failingAccepted.join(', ')}`,
    );
    process.exit(0);
  }
  process.exit(1);
}
const tracedCount = reqs.size - failingAccepted.length - missingProposed.length - brokenProposed.length;
console.log(`OK: ${reqs.size} requirements, ${tracedCount} traced, ${missingProposed.length + brokenProposed.length} proposed untraced.`);
