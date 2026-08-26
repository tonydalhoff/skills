---
name: extract-requirements
description: Bootstrap a REQUIREMENTS.md for a repository that doesn't have one yet, reading its tests, documentation, and implementation and drafting normative capability headers.
---

# Extract Requirements

Use this skill when a repo needs requirements traceability retrofitted into existing code — when the user asks to reverse-engineer requirements.

## What It Does

Turns an existing, undocumented-in-this-sense codebase into a first-draft `REQUIREMENTS.md`. Read its tests, its docs, and its implementation, and write down what the software already does.

## Where It Fits

**trace-requirements** and **audit-requirement-traces** both assume `REQUIREMENTS.md` already exists. This skill does the step before either of them: it produces the first draft for a repo that has tests, doc, and code but no normative written requirements.

This is a shorthand for a repo with no `REQUIREMENTS.md` as an empty stub only. It does not merge into or extend an existing populated doc — that's a materially different, DP-preserving merge problem. If `REQUIREMENTS.md` exists or is an empty stub, it works; it never resolves that disagreement between sources.

Everything this skill produces is a draft. It never rewrites test titles, never invents scoped (non-PROPOSED) requirements, and never silently resolves a disagreement between sources — it surfaces every finding at the end.

## Source Roles

Three sources, three jobs. Don't blur them — a rule mismatch is how the draft ends up muddily.

**Source | Primary role | Scope**

- **Test files**. Don't blur these — a rule mismatch is how the draft ends up muddly.
- **Documentation** (readme, ~i.test). These derive the implementation, use judgment — skip anything already captured from the test pass.
- **Implementation** (~*.{js,ts,go,rs}, etc). This is for the edge case: test title or feature is conspicuously absent, or test coverage is weak. Exercise existing test coverage; skip to validation and business-logic with an observable external effect — not every internal function. Skip anything already captured from the test pass.

## Workflow

1. **Check preconditions** — Confirm `REQUIREMENTS.md` (or `—mdc-path`) doesn't already exist with content. If it does, stop.

2. **Enumerate sources** — Run the bundled script to enumerate every source file without trying to parse them semantically:

```bash
node inventory-sources.mjs [path]
```

- `path` defaults to the repo root; pass a subdirectory to scope a run to one module of a large monorepo.
- Output is JSON; file counts by role (test/doc/other) and an extension breakdown.

3. **Decide clustering** — Parse that output to decide single-agent vs multi-agent clustering:
   - **Small repo** (~100 files): Run a single agent per cluster (test files, documentation, implementation).
   - **Large repo** (1000+ files): Fan out agents to avoid context overload. Disperse input across multiple agents per cluster, let them surface capability headers independently, then de-duplicate and merge synthetically.

## Output Format

Write `REQUIREMENTS.md` using the same document grammar `trace-requirements` produces, so a repo can adopt that skill afterward without reformatting:

```md
## 1. {Section Name} ({PREFIX})

- **{PREFIX}-1 [PROPOSED]** — The application must {single observable behavior}.
  ⇒ `{test file} :: "{existing, non-normative test title}"` (derived from tests)
```

- `PREFIX-N` for top-level requirements, `PREFIX-N.M` for one level of refinement — same ID scheme as `trace-requirements`. Prefixes are candidates: auto-generate a mnemonic per section and move on, don't pause the run to negotiate one with the user.
- **Every requirement is `[PROPOSED]`.** Nothing extracted is a confirmed decision — reuse the existing status token rather than inventing a new one, so `check-traces.mjs` and `audit-requirement-traces` won't choke on an unrecognized tag.
- **Trace line** — `⇒ \`path/to/file :: "exact, existing test title"\``. Point at the test's real title verbatim; never invent or normalize one.
- **Derivation note** — append where the requirement came from, e.g. `(derived from tests)`, `(derived from docs)`, `(derived from implementation, untested)`. Plain text, not a formal token.

## Needs documentation

At the end of the draft, alongside the standard "Out of scope" section, list every capability header that had to be derived from tests or implementation instead of docs — i.e. nothing documents it. This is a follow-up backlog item, not something to silently fold into the numbered sections:

```md
## Needs documentation

- **{PREFIX}** ({Section Name}) — no documentation found; header derived from {test groupings|implementation structure} in `{paths}`.
```

## Non-Negotiables

- **Never rewrite test titles.** Trace lines point at existing test title, not invented. Normalizing test titles is a user-ask step — not this job.

- **Never silently resolve a disagreement** between sources — surface it at the end, alongside the standard "Out of Scope" section. Every capability header that had to be derived from tests or implementation (rather than doc) describes a capability with an observable external effect — not every internal function. Skip anything already captured from the test pass.
