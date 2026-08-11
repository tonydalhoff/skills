---
name: audit-requirement-traces
description: Periodic, deep audit of a requirements document produced by the trace-requirements skill — verifies traces against real test-execution output (not just source text), scans for requirement smells (fan-out, loop/conditional tests, undocumented behavior), and runs an exploratory conformance-probing pass. Use when the user wants a requirements audit, a deep trace audit, "requirement smells", a conformance audit, or to sanity-check that a traceability gate isn't giving false confidence. Not for routine per-commit checks — see the trace-requirements skill's check-traces.mjs for that.
---

# Audit Requirement Traces

A periodic, heavier companion to the `trace-requirements` skill's everyday gate. That gate is static and fast: it never runs a test, so it can't tell a real test from a skipped stub, and it can't tell whether the *shape* of a requirements document is actually healthy. This skill does both, plus an exploratory pass that neither can do mechanically.

Run this before a release, after a burst of feature work, or when trust in the traceability gate itself needs re-establishing — not on every commit.

## The four phases

1. **Ground-truth trace fidelity** (`scripts/audit-traces.mjs`) — verifies every declared trace resolves to a testcase that actually ran, passed, and wasn't skipped, using a JUnit XML report as the source of truth instead of source-text grep. Also reports two smells that only execution can reveal:
   - **Fan-out** — a requirement ID with more than 3 executed testcases (default threshold). Usually means the requirement is too coarse, or a single declared trace exploded via `it.each`/`test.each` parametrization.
   - **Untraced tests** — testcases with no requirement-ID prefix at all. A high ratio means real behavior is under test but undocumented.

   ```sh
   node scripts/audit-traces.mjs junit-report.xml
   node scripts/audit-traces.mjs junit-report.xml --doc docs/requirements.md   # non-default path
   ```

   Produce the JUnit report from the project's own test run (e.g. vitest's `--reporter=junit --outputFile=junit-report.xml`, pytest's `--junitxml`, `gotestsum --junitfile`). Run this *after* a real test run, not as a substitute for one.

2. **Static requirement smells** (`scripts/requirement-smells.mjs`) — no execution needed. Flags traced tests whose body hides a loop (`for`/`forEach`/`while`, independent of `.each` parametrization) or a conditional assertion (`if`/`switch`/ternary around `expect(...)`). Both usually mean the test — and the requirement behind it — is covering multiple implicit cases that should be explicit sub-requirements instead.

   ```sh
   node scripts/requirement-smells.mjs tests/
   ```

   Advisory only (always exits 0); heuristic regex/brace-matching will have false positives — treat findings as candidates for review.

3. **Semantic cohesion review** — a requirement is a smell if it doesn't fit its section. Guided, not scriptable. See [PLAYBOOK.md](PLAYBOOK.md).

4. **Exploratory conformance probing** — direct-DB writes to test invariants outside the application layer, adversarial requests against documented boundaries, sweeps for accepted-but-unimplemented requirement families. Guided, not scriptable. See [PLAYBOOK.md](PLAYBOOK.md).

## Output

Produce a dated report under `.notes/` or `docs/`, structured per the template in [PLAYBOOK.md](PLAYBOOK.md): scope/caveat, executive summary, confirmed defects by severity, requirement-smell findings, verification results table, suggested triage order. Do not fix defects inline during the audit — report them; fixing is separate, reviewed work.

Copy both scripts into the target repo (e.g. `scripts/`) if the audit becomes a recurring practice there, same as `trace-requirements`' checker.
