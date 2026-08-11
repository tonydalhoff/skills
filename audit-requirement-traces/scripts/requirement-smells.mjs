#!/usr/bin/env node
// Static requirement-smell scan: flags traced tests (title starts with a
// requirement ID) whose body hides a loop or a conditional assertion.
//
// - Loop smell: `it.each`/`test.each` parametrization, or a `for`/`forEach`/
//   `while` construct inside the test body. Usually means the loop's
//   conditions should be explicit sub-requirements instead of implicit
//   test-data variants.
// - Conditional-assertion smell: an `if`/`switch` or a ternary inside an
//   `expect(...)` call within the body. Usually means the test — and the
//   requirement behind it — is ambiguous about which behavior is expected.
//
// This is advisory, not a gate: it always exits 0. Regex/brace-counting
// heuristics will have false positives (e.g. braces inside string/template
// literals can throw off body extraction) and false negatives (helper
// functions that hide the loop or conditional one level away). Treat
// findings as candidates for human review, not proof.
//
// Usage: node requirement-smells.mjs <tests-dir> [<tests-dir>...]

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const testDirs = process.argv.slice(2);
if (testDirs.length === 0) {
  console.error('Usage: requirement-smells.mjs <tests-dir> [<tests-dir>...]');
  process.exit(2);
}

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
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

const idTitleRe = /^([A-Z]{2,6}-\d+(?:\.\d+)*):/;

const extractBody = (source, fromIndex) => {
  const open = source.indexOf('{', fromIndex);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
};

const findings = []; // { file, title, smell, detail }

for (const file of files) {
  const content = readFileSync(file, 'utf8');

  const eachRe = /\b(?:it|test)\.each\s*\(/g;
  for (const m of content.matchAll(eachRe)) {
    const window = content.slice(m.index, m.index + 500);
    const titleMatch = window.match(/["'`]([A-Z]{2,6}-\d+(?:\.\d+)*:[^"'`]*)["'`]/);
    if (titleMatch) {
      findings.push({ file, title: titleMatch[1], smell: 'loop', detail: 'it.each/test.each parametrization' });
    }
  }

  const plainCallRe = /\b(?:it|test)\s*\(\s*(["'`])([A-Z]{2,6}-\d+(?:\.\d+)*:[^"'`]*)\1/g;
  for (const m of content.matchAll(plainCallRe)) {
    const title = m[2];
    const body = extractBody(content, m.index + m[0].length);
    if (!body) continue;
    if (/\bfor\s*\(|\bforEach\s*\(|\bwhile\s*\(/.test(body)) {
      findings.push({ file, title, smell: 'loop', detail: 'loop construct inside test body' });
    }
    if (/\bif\s*\(|\bswitch\s*\(/.test(body) || /expect\([^;{}]*\?[^;{}]*:[^;{}]*\)/.test(body)) {
      findings.push({ file, title, smell: 'conditional', detail: 'conditional logic inside test body' });
    }
  }
}

if (findings.length === 0) {
  console.log('OK: no loop or conditional-assertion smells found in traced tests.');
  process.exit(0);
}

const loops = findings.filter((f) => f.smell === 'loop');
const conditionals = findings.filter((f) => f.smell === 'conditional');

if (loops.length) {
  console.warn(`warning: ${loops.length} traced test(s) with loop/parametrization smell — consider explicit sub-requirements per case:`);
  for (const f of loops) console.warn(`  - ${f.file} :: "${f.title}" (${f.detail})`);
}
if (conditionals.length) {
  console.warn(`warning: ${conditionals.length} traced test(s) with conditional-assertion smell — the requirement may be ambiguous:`);
  for (const f of conditionals) console.warn(`  - ${f.file} :: "${f.title}" (${f.detail})`);
}
process.exit(0);
