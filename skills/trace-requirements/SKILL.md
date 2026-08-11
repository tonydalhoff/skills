---
name: trace-requirements
description: Create and maintain hierarchical requirements documents where every "The application must..." statement traces to a normative test title, and verify requirement-test coverage with a bundled checker script. Use when the user wants a requirements doc, requirements traceability, "trace requirements to tests", coverage of requirements by tests, or to update requirement statuses as decisions land.
---

# Trace Requirements

Turn decided design positions into a requirements document where every requirement is a single testable "The application must…" statement traced to a specific test, and every test title is greppable back to its requirement ID.

**Convention:** the document lives at the repo root as `REQUIREMENTS.md` — same discoverability pattern as `AGENTS.md`/`README.md`, so any tool or agent can find it without being told the path. If a project already has an established path (e.g. `docs/requirements.md`), don't force a move; pass `--doc <path>` to the scripts instead.

## Quick start

A requirement line and its trace:

```md
- **SCR-2** — The application must assign a flat 80-stroke Score to a golfer
  for any Round with no recorded score once that Round is scored.
  ⇒ `tests/unit/scoring.test.ts :: "SCR-2: assigns a flat 80-stroke score to a round with no recorded score"`
```

The test title is **normative**: when the test is written, it uses that exact string, ID first.

## Writing workflow

1. **Mine sources.** Decided positions come from the conversation, `CONTEXT.md`, `docs/adr/`, and linked issues. Only confirmed decisions become accepted requirements; recommendations still awaiting user confirmation get **[PROPOSED]**.
2. **Choose sections** with 2–6 letter mnemonic prefixes (`TRN`, `POOL`, `SCR`…). Use the project's own vocabulary — glossary terms from `CONTEXT.md` when it exists.
3. **Write statements** per the rules below. Nest refinements one level deep (`SCR-2` → `SCR-2.1`).
4. **Trace each requirement** to a planned or existing test: file path + exact title beginning with the ID. Pure logic → `tests/unit/`; I/O, auth, endpoints, persistence → `tests/integration/`.
5. **Surface implied requirements** — validation edges and interactions the conversation implied but never stated (e.g. "a penalty score competes in the N-lowest selection on equal terms"). Flag these to the user explicitly; they are the highest-value lines in the doc.
6. **Add an "Out of scope" section** for explicit exclusions, each with status if unconfirmed.
7. **Run the checker** (below) and offer to wire it into CI.

## Statement rules

- Begin with "The application must" / "must not" (or an equally rigorous subject like "The sync job must").
- One observable behavior per statement — if "and" joins two behaviors, split them.
- Testable: someone must be able to write a *failing* test for it.
- No implementation detail unless the detail *is* the requirement (e.g. "HttpOnly cookies").
- Child requirements refine or constrain their parent; they never contradict it.
- When a decision changes, rewrite or re-status the requirement — never silently delete it.

## Verifying coverage

```sh
node <skill-dir>/scripts/check-traces.mjs tests/
node <skill-dir>/scripts/check-traces.mjs --doc docs/requirements.md tests/   # non-default path
```

- Exits 1 listing accepted requirements whose declared trace doesn't resolve — the named file must contain the exact title, not just the requirement ID.
- **[PROPOSED]** requirements without tests → warning only.
- Test titles that use a requirement ID but don't match any declared trace (orphans, or drift from the doc's normative title) → warning.

Copy the script into the target repo (e.g. `scripts/check-traces.mjs`) when wiring it into CI so the check doesn't depend on this skill being installed.

This is a fast, static, per-commit check. For a periodic deeper audit — real test-execution ground truth, requirement-smell detection, exploratory conformance probing — use the `audit-requirement-traces` skill instead.

See [FORMAT.md](FORMAT.md) for the full document grammar, ID scheme, and a CI snippet.
