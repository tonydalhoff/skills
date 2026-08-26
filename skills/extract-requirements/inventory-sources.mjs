#!/usr/bin/env node
// Enumerate a repo's candidate requirement sources without reading or parsing their contents: test
// files, documentation files, and everything else (bucketed by extension, for the file-type clustering dimension).
//
// Purely structural — comprehension of what a file *means* is the LLM's job, not this script's. Purpose: (1) guarantee the extraction pass covers every
// file instead of sampling, (2) give a size signal to help decide single-agent vs multi-agent clustering.
//
// Usage: node inventory-sources.mjs [path]
// path defaults to the current directory. Output is JSON on stdout.

import { readdirSync, statSync } from 'node:fs';
import { join, extname, basename, relative, sep } from 'node:path';

const root = process.argv[2] || '.';
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'target', 'vendor', 'coverage',
  '.next', '.venv', 'venv', '__pycache__', '.tox', 'out',
]);

const TEST_NAME_RE = /(\.(test|spec)\.[a-z]+$)|(_test\.[a-z]+$)|(_spec\.[a-z]+$)|(^test_.*)/;
const DOC_EXT_RE = /\.(md|mdx|rst|adoc)$/i;

let root_ = root;
const files = [];
const walk = (dir) => {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name) || (name.startsWith('.') && name !== '.')) continue;
      walk(p);
    } else {
      files.push(p);
    }
  }
};

walk(root_);

const testFiles = [];
const docFiles = [];
const otherFiles = [];
const extensionCounts = {};

for (const f of files) {
  const rel = relative(root_, f).split(sep).join('/');
  const name = basename(f);
  const isUnderTestsDir = /(^|\/)(__tests?__|tests?|spec|__spec__)\//.test(rel);
  const isUnderDocsDir = /(^|\/)docs?\//.test(rel);
  const isReadme = /^readme/i.test(name);

  let category = 'other';
  if (TEST_NAME_RE.test(name) || (isUnderTestsDir && !DOC_EXT_RE.test(name))) {
    testFiles.push(rel);
    category = 'test';
  } else if (isReadme || (DOC_EXT_RE.test(name) && (isUnderDocsDir || isReadme))) {
    docFiles.push(rel);
    category = 'doc';
  } else {
    otherFiles.push(rel);
  }

  const ext = extname(name) || '(none)';
  extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
}

const result = {
  root: root_,
  counts: {
    testFiles: testFiles.length,
    docFiles: docFiles.length,
    otherFiles: otherFiles.length,
    totalFiles: files.length,
  },
  extensionCounts,
  testFiles,
  docFiles,
  otherFiles,
};

console.log(JSON.stringify(result, null, 2));
