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

1. **Set the scope.** A run covers one root: the repo root by default, or a subdirectory to bootstrap a single package of a monorepo. The draft is written as `REQUIREMENTS.md` at that root — a run scoped to `packages/api` writes `packages/api/REQUIREMENTS.md` — and every path inside it, trace lines included, is relative to that root. Confirm that file doesn't already exist with content. If it does, stop.

2. **Inventory.** Run the bundled script to enumerate every candidate source file under the scope root, without trying to parse them semantically:

   ```sh
   node <skill-dir>/scripts/inventory-sources.mjs [path]
   ```

   `path` is the scope root from step 1, defaulting to the current directory. Output is JSON: per-role file counts (test/doc/other) as the size signal for the next step, a per-extension count across all files as a shape signal, and the full file list for each role. Work from those lists — they're the difference between covering the repo and sampling it.

3. **Decide clustering,** using the inventory's file counts as the size signal:
   - **Small repo:** a single agent (or the current session) reads everything directly — tests, docs, then implementation, in that priority order — and drafts capability headers + requirement statements in one pass. Skip to step 6.
   - **Large repo:** partition by directory — one agent per top-level module, with every file in the inventory assigned to exactly one cluster. One partition, not several overlapping ones: a second axis re-reads the same files to produce mostly the same requirements, and the merge pass then pays for it twice, in duplicate requirements and in colliding ID prefixes. The cross-cutting behavior a directory split genuinely does miss is recovered in step 5, at the cost of one pass rather than a whole second partition.

4. **Dispatch.** One agent per cluster, using your environment's task/subagent-spawning capability, each producing a fragment: candidate capability headers + requirement statements + provenance notes for its slice, in the format from [Output](#output). If your environment has no subagent-spawning capability, run each cluster's pass sequentially in the same session instead — slower, not skipped. Before moving on, check the union of the clusters' assigned files against the inventory's lists; whatever is left over is uncovered.

5. **Synthesize.** If step 4 ran, a merge pass is required before anything is written:
   - Reconcile the fragments into one coherent draft: dedupe requirements that more than one cluster reported, and apply the "surface, don't resolve" rule from [Non-negotiables](#non-negotiables) to anything the clusters genuinely disagreed on.
   - **Then make one cross-cutting pass** — the recall a single directory partition can't produce on its own. Grep for domain terms and identifiers that appear in three or more clusters, and ask what capability spans them. Behavior that lives in no one directory (auth, rate limiting, audit logging, error taxonomy) is exactly what a directory split drops, and it's usually a capability header in its own right rather than a stray requirement.

   If step 3 went straight to a single pass, there's nothing to merge and no partition to cross — proceed straight to writing.

6. **Write the draft** at the scope root, in the format below, then run the bundled checker as a sanity pass:

   ```sh
   node <skill-dir>/scripts/check-draft.mjs [doc-path]
   ```

   It reports requirement lines it can't parse instead of skipping them, IDs that aren't `[PROPOSED]`, duplicate or off-prefix IDs left behind by the merge, and trace lines whose file or title doesn't resolve — the transcription slips that copying a test title by hand invites. Fix what it reports and re-run before handing the draft over. A requirement with no trace line at all is fine and reported as a note, not a failure: behavior found only in implementation has no test to point at.

## Output

The draft uses the same document grammar `trace-requirements` consumes, so it's usable by that skill's everyday checker the day a human accepts it:

- **Section header:** `## N. {Section Name} ({PREFIX})`. A prefix is 2–6 uppercase letters, mnemonic for the section (`SCR` → Scoring), unique within the document.
- **Requirement ID:** `PREFIX-N`, or `PREFIX-N.M` for one level of refinement — no deeper. If you reach for `N.M.K`, the parent is too broad; split the section. A refinement constrains its parent; it never contradicts it.
- **Statement:** one observable behavior, beginning "The application must" / "must not" (or an equally rigorous subject like "The sync job must"). If "and" joins two behaviors, split them.
- **Trace line:** ``⇒ `{file} :: "{title}"` `` on the line beneath the statement, quoting an existing test title verbatim, path relative to the draft. A requirement with no test to point at carries no trace line.

Extraction-specific conventions on top of that grammar:

- **Every requirement is `[PROPOSED]`.** Nothing extracted is a confirmed decision — reuse the existing status token rather than inventing a new one, so the `trace-requirements` checker and `audit-requirement-traces` treat it the same as any other proposed requirement.
- **Provenance note** on each requirement: append where it came from, e.g. `(derived from tests)`, `(derived from docs)`, `(derived from implementation, untested)`. Plain text, not a formal token.
- **ID prefixes are candidates.** Auto-generate a mnemonic per section and move on — don't pause the run to negotiate a prefix with the user. Nothing downstream references these IDs yet, so renaming during review is cheap.
- **Findings go in three separate trailing sections**, not one bucket — they have different readers and different fixes:
  - **"Disagreements"** — incompatible claims only: a doc says X where a test asserts not-X, implementation contradicts a doc's claim, or two clusters disagreed at the synthesis step. State what each source claims; don't pick a winner. Non-overlap is not disagreement — the three sources have different jobs (see [Source roles](#source-roles)), so most behavior is described by exactly one of them, and filing that as conflict buries the real ones.
  - **"Unverified doc claims"** — a documented capability with no test *and* no implementation behind it. Check the implementation before filing one: if the code does implement it and only a test is missing, that's an ordinary coverage gap, not a finding; if neither exists, the doc is probably stale, and that's worth the user's attention.
  - **"Needs documentation"** — every capability header that had to be derived from tests or implementation because nothing documents it, listed as a follow-up backlog item rather than folded silently into the numbered sections.

```md
# Requirements

Draft extracted from this repository's tests, docs, and implementation on {date}.

**Status:** every requirement below is **[PROPOSED]** — extracted from what the code
already does, not from a confirmed decision. Review before treating any of it as accepted.

## N. {Section Name} ({PREFIX})

- **{PREFIX}-1 [PROPOSED]** — The application must {single observable behavior}.
  ⇒ `{test file} :: "{existing, non-normative test title}"` (derived from tests)

## Disagreements

- {What source A claims} vs. {what source B claims}, re: {capability}. (`{files involved}`)

## Unverified doc claims

- {Capability the docs describe} — no test and no implementation found. (`{doc file}`)

## Needs documentation

- **{PREFIX}** ({Section Name}) — no documentation found; header derived from {test groupings|implementation structure} in `{paths}`.

## Out of scope

- {Explicit exclusion}. **[PROPOSED]** if unconfirmed.
```

## Non-negotiables

- **Never rewrite test titles.** Trace lines point at existing, non-normative titles as-is. Normalizing titles to be ID-first is a separate, explicitly-invoked follow-up — not part of this pass.
- **Never silently resolve a disagreement.** When two sources make incompatible claims — a doc contradicted by a test, implementation contradicting a doc, or two clusters disagreeing at the synthesis step — surface it in "Disagreements" (see [Output](#output)) for the user to resolve. These are usually the most valuable finding of the whole exercise; don't bury them by picking a winner, and don't dilute them with the expected non-overlap between sources.
- **Never touch an existing populated `REQUIREMENTS.md`.** This skill only bootstraps from nothing.
