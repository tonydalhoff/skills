---
name: extract-requirements
description: Bootstrap a REQUIREMENTS.md for a repository that doesn't have one yet, by reading its tests, documentation, and implementation and drafting normative capability headers and requirement statements in the trace-requirements format. Use when a repo needs requirements traceability retrofitted onto existing code, when the user asks to reverse-engineer/extract/derive requirements from a codebase, or to bootstrap a requirements doc from what's already built.
---

# Extract Requirements

Turn an existing, undocumented-in-this-sense codebase into a first-draft `REQUIREMENTS.md`: read its tests, its docs, and its implementation, and write down what the software is already committed to doing, in the same normative "must" statement + trace format that `trace-requirements` uses going forward.

## Where it fits

`trace-requirements` and `audit-requirement-traces` both assume `REQUIREMENTS.md` already exists. This skill is the step before either of them: it produces the first draft for a repo that has none. Once the draft exists, day-to-day work goes back to `trace-requirements`; periodic health checks go to `audit-requirement-traces`.

This is a **bootstrap for a repo with no `REQUIREMENTS.md`** (or an empty stub) only. It does not merge into or extend an existing populated doc — that's a materially different, ID-preserving merge problem. If `REQUIREMENTS.md` already exists and is non-empty, stop and tell the user; don't overwrite it.

Everything this skill produces is a draft. It never rewrites test titles, never invents accepted (non-`[PROPOSED]`) requirements, and never silently resolves a disagreement between sources — see [Non-negotiables](#non-negotiables).

## Source roles

Three sources, three jobs. Don't blur them — a role mismatch is how the draft ends up mushy.

| Source | Primary role | Scope |
|---|---|---|
| **Documentation** (`README*`, `docs/**`, ADRs) | Capability / section headers | Curated, current-state docs only. Not inline code comments (implementation's job), not CHANGELOGs (historical, not current capability). |
| **Tests** | Requirement statements, plus a secondary source of capability headers via suite/`describe`-level groupings | Read for meaning — comprehension, not regex. A test's title is a hint at best; the assertions are the actual requirement. |
| **Implementation** | Requirement statements only, and a tertiary/fallback source of capability headers | Gap-fill only: behavior with **zero** existing test coverage, scoped to validation and business-rule logic with an observable external effect — not every function. Skip anything already captured from the test pass. |

**Capability-header fallback chain:** docs → test suite groupings → implementation structure. Fall back to implementation only when *neither* docs nor test structure reveals a grouping (e.g. a flat test file with no suite nesting, or logic with no tests at all). When deriving from implementation, use judgment — group by module/directory boundaries or by public class/exported-function names, whichever produces a cleaner mnemonic for this codebase. There's no fixed rule here; codebases are organized too differently for one to hold.

Any capability header that had to come from tests or implementation instead of docs — i.e. nothing documents it — goes in a distinct **"Needs documentation"** list at the end of the draft (see [Output](#output)). Don't fold it silently into the numbered sections; it's an actionable gap, not just another line.

## Workflow

1. **Check preconditions.** Confirm `REQUIREMENTS.md` (or `--doc <path>`) doesn't already exist with content. If it does, stop.

2. **Inventory.** Run the bundled script to enumerate every candidate source file without trying to parse them semantically:

   ```sh
   node <skill-dir>/scripts/inventory-sources.mjs [path]
   ```

   `path` defaults to the repo root; pass a subdirectory to scope a run to one module of a large monorepo. Output is JSON: file counts by role (test/doc/other) and an extension breakdown of the "other" bucket — a size and shape signal for the next step.

3. **Decide clustering,** using the inventory's file counts as the size signal:
   - **Small repo:** a single agent (or the current session) reads everything directly — tests, docs, then implementation, in that priority order — and drafts capability headers + requirement statements in one pass. Skip to step 6.
   - **Large repo:** fan out across clusters, at minimum:
     - **Directory clustering** — one agent per top-level module/directory.
     - **Identifier/reference clustering** — group files by shared domain terms or identifiers they reference in common (grep-level co-occurrence is enough; this doesn't need a formal algorithm).
     - **File-type clustering** — group by extension/language, useful when a repo mixes e.g. application code with infra-as-code or scripts that the other two axes might not naturally separate.

4. **Dispatch.** One agent per cluster per dimension, using your environment's task/subagent-spawning capability, each producing a fragment: candidate capability headers + requirement statements + provenance notes for its slice, in the format from [Output](#output). If your environment has no subagent-spawning capability, run each cluster's pass sequentially in the same session instead — slower, not skipped.

5. **Synthesize.** If step 4 ran, a merge pass is required before anything is written: reconcile all cluster fragments into one coherent draft — dedupe capabilities and requirements that showed up under more than one clustering axis, unify colliding ID prefixes (a directory-cluster and an identifier-cluster will independently invent their own), and apply the same "surface, don't resolve" rule from [Non-negotiables](#non-negotiables) to genuine disagreements between clusters. If step 3 skipped straight to a single pass, there's nothing to merge — proceed straight to writing.

6. **Write `REQUIREMENTS.md`** in the format below, then run the checker as a sanity pass:

   ```sh
   node <path-to-trace-requirements-skill>/scripts/check-traces.mjs --progress --doc REQUIREMENTS.md <tests-dir>...
   ```

   `--progress` never fails the run; it just reports what did and didn't resolve, so malformed trace lines or title mismatches surface before the user ever opens the file.

## Output

Write in the same grammar `trace-requirements` uses (`## N. {Section Name} ({PREFIX})` headers, `⇒ file :: "title"` trace lines — see that skill for the full document skeleton) with these extraction-specific conventions:

- **Every requirement is `[PROPOSED]`.** Nothing extracted is a confirmed decision — reuse the existing status token rather than inventing a new one, so `check-traces.mjs` and `audit-requirement-traces` treat it the same as any other proposed requirement.
- **Provenance note** on each requirement: append where it came from, e.g. `(derived from tests)`, `(derived from docs)`, `(derived from implementation, untested)`. Plain text, not a formal token.
- **ID prefixes are candidates.** Auto-generate a mnemonic per section and move on — don't pause the run to negotiate a prefix with the user. Nothing downstream references these IDs yet, so renaming during review is cheap.
- **"Disagreements" section** at the end, before "Needs documentation": every case where sources conflicted — a doc describing a capability with no matching test, a test asserting something no doc mentions, implementation contradicting a doc's claim, or two clusters disagreeing at the synthesis step. State what each source claims; don't pick a winner.
- **"Needs documentation" section** at the end, alongside the standard "Out of scope" section: every capability header that had to be derived from tests or implementation instead of docs is listed as a follow-up backlog item, not folded silently into the numbered sections.

```md
## N. {Section Name} ({PREFIX})

- **{PREFIX}-1 [PROPOSED]** — The application must {single observable behavior}.
  ⇒ `{test file} :: "{existing, non-normative test title}"` (derived from tests)

## Disagreements

- {What source A claims} vs. {what source B claims}, re: {capability}. (`{files involved}`)

## Needs documentation

- **{PREFIX}** ({Section Name}) — no documentation found; header derived from {test groupings|implementation structure} in `{paths}`.
```

## Non-negotiables

- **Never rewrite test titles.** Trace lines point at existing, non-normative titles as-is. Normalizing titles to be ID-first is a separate, explicitly-invoked follow-up — not part of this pass.
- **Never silently resolve a disagreement.** A doc describing a capability with no matching test, a test asserting something no doc mentions, implementation contradicting a doc's claim, or two clusters disagreeing at the synthesis step — all get surfaced explicitly for the user to resolve (see the "Disagreements" section in [Output](#output)). These disagreements are usually the most valuable finding of the whole exercise; don't bury them by picking a winner.
- **Never touch an existing populated `REQUIREMENTS.md`.** This skill only bootstraps from nothing.
