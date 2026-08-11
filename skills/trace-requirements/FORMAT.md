# Trace Requirements — Document Grammar

## Document skeleton

```md
# Requirements

Hierarchical, testable requirements derived from {sources} through {date}.

**Status:** requirements marked **[PROPOSED]** rest on decisions not yet
confirmed (link the open-decisions list). All others are accepted.

**Traceability convention:** every requirement traces to at least one test via
an explicit `⇒ file :: "title"` line. A trace only counts if the named file
contains that exact title, verbatim — matching the requirement ID alone is
not enough. CI checks every declared trace line in this document against the
named test file and fails if any accepted requirement has a trace that
doesn't resolve, or has no trace at all. Test titles below are normative —
implement them verbatim.

---

## 1. {Section Name} ({PREFIX})

- **{PREFIX}-1** — The application must {single observable behavior}.
  ⇒ `{test file} :: "{PREFIX}-1: {short behavior description}"`
  - **{PREFIX}-1.1** — The application must {refinement of parent}.
    ⇒ `{test file} :: "{PREFIX}-1.1: {short behavior description}"`
- **{PREFIX}-2 [PROPOSED]** — The application must {behavior pending decision}.
  ⇒ `{test file} :: "{PREFIX}-2: {short behavior description}"`

## Out of scope (v1)

- {Explicit exclusion}. **[PROPOSED]** if unconfirmed.
```

## ID scheme

- `PREFIX-N` for top-level requirements, `PREFIX-N.M` for one level of refinement. No deeper nesting — if you need `N.M.K`, the parent is too broad; split the section.
- Prefixes: 2–6 uppercase letters, mnemonic for the section (`SCR` → Scoring). Unique per document.
- IDs are permanent. A dropped requirement keeps its ID with a strikethrough or a "superseded by" note; never reuse an ID for a different behavior.

## Trace line

```
⇒ `path/to/file.test.ts :: "ID: description"`
```

- The `::` separates file path from the exact test title.
- One trace minimum per requirement; multiple traces allowed (list one per line).
- UI-behavior requirements trace to component/integration tests; keep the same title convention.

## Status lifecycle

| Status | Meaning | Checker behavior |
|---|---|---|
| (none) | Accepted — decision confirmed | untraced → **failure** |
| `[PROPOSED]` | Rests on an unconfirmed decision/recommendation | untraced → warning |
| `~~ID~~` + note | Dropped/superseded | ignored |

When a decision lands: drop the `[PROPOSED]` tag, or rewrite the statement to match the decision (keeping the ID if the behavior is recognizably the same, retiring it otherwise).

## CI snippet (GitHub Actions)

```yaml
- name: Check requirement traceability
  run: node scripts/check-traces.mjs tests/
```

Run it after tests in the same job so a green build guarantees both "tests pass" and "every accepted requirement has a test."

**`--progress` is a bootstrap aid, not a CI mode.** It prints coverage and always exits 0, for tracking an in-progress build-out locally. If it ends up wired into the CI invocation above, the traceability gate is not actually enforced — CI stays green regardless of untraced requirements, which defeats the point of the check. Use it locally during active work; drop the flag before the check runs in CI, and drop it from CI the moment a story that added it is done, not "later."

## Deep audits

This checker is a static, per-commit gate — it never runs a test, so it can't tell a real test from a skipped one, and it can't evaluate whether the document itself is well-shaped (a requirement with excessive test fan-out, a test hiding a loop or a conditional that implies undocumented sub-requirements, an accepted section with no implementation at all). For that, see the `audit-requirement-traces` skill — a periodic, heavier audit meant to run before a release or when trust in this gate needs re-establishing, not on every commit.
