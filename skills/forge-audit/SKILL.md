---
name: forge-audit
description: Audit a completed Forge effort's normative requirements against executed tests, requirement smells, and exploratory probes. Use before a release or when a Forge effort needs traceability confidence re-established.
---

# Forge Audit - Requirements Conformance

Stage 8 of the Forge pipeline. Read `.forge/<slug>/units.md`, `.forge/<slug>/discovery.md`, `REQUIREMENTS.md` (or the repository's established requirements-document path), the effort design, and the committed implementation. Stop if build units remain unchecked or the normal `check-traces.mjs` gate does not pass; return to `forge-build` first.

Run `audit-requirement-traces` for this effort. It is a periodic confidence check, not a per-commit gate.

1. Pin the audit to the current commit and preserve concurrent working-tree changes.
2. Run the project's real test command with JUnit output, then run `audit-traces.mjs` against that report and `requirement-smells.mjs` against the tests.
3. Review requirement sections for semantic cohesion against the domain model and ADRs.
4. Perform only the exploratory conformance probes relevant to the accepted requirements.
5. Write the report using the audit skill's report template to `.forge/<slug>/audit-YYYY-MM-DD.md`. Include the traceability results, defects, smells, caveats, and triage order.

The audit reports findings; it does not fix them. If it finds defects or traceability gaps, create follow-up Forge work or tickets, and leave this effort at built rather than audited. If it finds no blocking gaps, report the effort audited and the Forge pipeline complete.
