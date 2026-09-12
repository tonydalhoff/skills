#!/usr/bin/env node
// Sanity-check an extracted REQUIREMENTS.md draft before handing it to a human.
//
// Built for a freshly generated draft rather than for CI: it reports requirement lines it
// cannot parse instead of silently skipping them (a draft's whole content is new, so a
// malformed ID is the likeliest defect), tolerates requirements with no trace line
// (behavior found only in implementation has no test to point at), and needs no tests
// directory — a repo with no tests at all is a legitimate extraction target.
//
// Usage: node check-draft.mjs [doc-path]
// doc-path defaults to REQUIREMENTS.md; trace paths resolve relative to the doc.
// Exit codes: 0 = clean, 1 = problems found, 2 = doc missing/unreadable.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const docPath = process.argv[2] || 'REQUIREMENTS.md';

let doc;
try {
  doc = readFileSync(docPath, 'utf8');
} catch {
  console.error(`Draft not found: ${docPath}`);
  process.exit(2);
}
const docDir = dirname(resolve(docPath));

// `## 3. Scoring (SCR)` — a numbered capability section and its declared prefix.
const numberedSectionRe = /^##\s+\d+\./;
const sectionPrefixRe = /\(([^)]*)\)\s*$/;
// `- **SCR-2 [PROPOSED]** — …`, at any indent (refinements are nested list items).
const reqRe = /^\s*-\s+\*\*([A-Z]{2,6})-(\d+(?:\.\d+)*)(\s*\[PROPOSED\])?\*\*/;
// The superset every requirement line must match: a list item opening in bold.
const bulletRe = /^\s*-\s+\*\*/;
const traceRe = /⇒\s*`([^`]+?)\s*::\s*"([^"]+)"`/;

const contentCache = new Map();
const readCached = (path) => {
  if (contentCache.has(path)) return contentCache.get(path);
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
  contentCache.set(path, content);
  return content;
};

const containsTitle = (content, title) =>
  content.includes(`"${title}"`) || content.includes(`'${title}'`) || content.includes('`' + title + '`');

const problems = [];
const reqs = new Map(); // id -> { line, traces }
let inNumberedSection = false;
let sectionPrefix = null;
let current = null;

doc.split('\n').forEach((line, i) => {
  const ln = i + 1;

  if (line.startsWith('## ')) {
    current = null;
    sectionPrefix = null;
    inNumberedSection = numberedSectionRe.test(line);
    if (!inNumberedSection) return;
    const declared = line.match(sectionPrefixRe);
    if (!declared) {
      problems.push(`${ln}: numbered section declares no (PREFIX): ${line.trim()}`);
    } else if (!/^[A-Z]{2,6}$/.test(declared[1])) {
      problems.push(`${ln}: section prefix "${declared[1]}" is not 2-6 uppercase letters`);
    } else {
      sectionPrefix = declared[1];
    }
    return;
  }

  if (inNumberedSection && bulletRe.test(line)) {
    const req = line.match(reqRe);
    if (!req) {
      problems.push(`${ln}: unparseable requirement line, expected \`- **PREFIX-N [PROPOSED]** — …\`: ${line.trim()}`);
      current = null;
      return;
    }
    const [, prefix, num, proposed] = req;
    const id = `${prefix}-${num}`;
    if (!proposed) problems.push(`${ln}: ${id} is not [PROPOSED] — nothing extracted is a confirmed decision`);
    if (num.split('.').length > 2) problems.push(`${ln}: ${id} nests deeper than one level — split the section instead`);
    if (sectionPrefix && prefix !== sectionPrefix) problems.push(`${ln}: ${id} does not use its section's prefix (${sectionPrefix})`);
    if (reqs.has(id)) problems.push(`${ln}: duplicate ID ${id}, first declared on line ${reqs.get(id).line}`);
    else reqs.set(id, { line: ln, traces: 0 });
    current = reqs.get(id);
    return;
  }

  const trace = line.match(traceRe);
  if (!trace) return;
  if (!current) {
    problems.push(`${ln}: trace line belongs to no requirement: ${line.trim()}`);
    return;
  }
  current.traces++;
  const [, file, title] = trace;
  const content = readCached(file.trim());
  if (content === null) problems.push(`${ln}: trace points at a missing file: ${file.trim()}`);
  else if (!containsTitle(content, title)) problems.push(`${ln}: title not found in ${file.trim()}: "${title}"`);
});

if (reqs.size === 0) problems.push('no requirements found — the draft has no parseable requirement lines');

const untraced = [...reqs].filter(([, r]) => r.traces === 0).map(([id]) => id);
if (untraced.length)
  console.warn(`note: ${untraced.length} requirement(s) with no trace line (expected where no test covers the behavior): ${untraced.join(', ')}`);

if (problems.length) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  console.error(`\n${problems.length} problem(s) in ${docPath}`);
  process.exit(1);
}

console.log(`OK: ${reqs.size} requirements, ${reqs.size - untraced.length} traced, all [PROPOSED].`);
