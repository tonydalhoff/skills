---
name: forge-build
description: Implement Forge units with task-selected build and review perspectives, isolated parallel worktrees where safe, tests, and commits. Use after forge-decompose has produced a units checklist.
---

# Forge Build - Execution

Stage 7 of the Forge pipeline. Read `.forge/<slug>/units.md`; if absent, stop and run `forge-decompose`. Also keep `.forge/<slug>/design.md`, `.forge/<slug>/discovery.md`, `REQUIREMENTS.md` (or the repository's established requirements-document path), and the ADR at hand.

## Pick ready units

A unit is ready only when every dependency is checked off.

- Implement one ready unit or a dependent chain directly, one unit at a time.
- Use parallel agents only for multiple truly independent ready units, with worktree-level isolation and a verification pass for each result.
- Never parallelize units that touch overlapping files or depend on one another.
- Preserve every HITL checkpoint.

## Select perspectives

Every unit gets a **build** perspective (the smallest implementation that meets its acceptance criteria) and a **verification** perspective (the behavior, tests, and traces that prove it). Add only the perspectives whose omission creates material risk:

- **Requirements tracer** — missing acceptance criteria, ambiguous behavior, and work that does not map to a stated outcome. Select when scope is unclear or delivery must be demonstrably complete.
- **System integrator** — interface mismatches, dependency ordering, configuration gaps, and cross-component failure modes. Select when the work crosses a module, service, persistence, API, or third-party boundary.
- **Failure analyst** — invalid inputs, partial failure, retries, races, recovery, rollback, and unsafe state transitions. Select when reliability, data integrity, or safe degradation matters.
- **Verification designer** — untested behaviors, weak assertions, brittle test seams, and the smallest evidence that establishes correctness. Select for every unit, especially when behavior is subtle or consequential.
- **Maintainer advocate** — unnecessary complexity, unclear ownership, hidden coupling, migration risk, and future debugging cost. Select when choosing an implementation shape or changing shared, mature, or operationally sensitive areas.

Choose perspectives from the unit's acceptance criteria, design, discovery, and affected files—not by role title or model. A perspective can be held by the implementer, an independent reviewer, or a focused subagent. Give any delegated perspective a narrow brief: unit, lens, evidence to inspect, and the decision or findings required. Keep its findings scoped to the unit; a finding that changes the design, requirements, ADR, or an unchecked dependency returns to the relevant earlier Forge stage or HITL checkpoint.

## Per unit

1. Record the selected perspectives and their concrete questions in the unit's implementation notes or commit/PR description.
2. Implement only the unit's scope, using the build perspective and any selected delivery lenses.
3. Verify its acceptance criteria through the verification perspective; obtain an independent pass when the unit's risk or repository rules require one.
4. For each requirement ID in its acceptance criteria, implement the declared normative test title verbatim and update its trace only when the intended behavior changed.
5. Check its box in `units.md`.
6. Commit using the repository's existing conventions.
7. Run the broader project test suite when the affected area warrants it.

Before declaring all units complete, run the full test suite and `node <trace-requirements-skill>/scripts/check-traces.mjs <tests-dir>` without `--progress`. Resolve every accepted missing or drifting trace. Commits and pushes may be autonomous when already authorized. Confirm before opening a pull request, and batch related units at a natural checkpoint unless asked otherwise.

When every unit is checked and the hard trace gate passes, report the build complete and recommend `forge-audit` before a release or after a substantial delivery. Use `forge-status` for progress before then.
