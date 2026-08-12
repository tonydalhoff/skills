---
name: forge-build
description: Implement units from a forge decomposition sequentially or, for independent work, in isolated parallel worktrees, verifying tests and committing each landed unit. Use after forge-decompose has produced a units checklist.
---

# Forge Build - Execution

Stage 7 of the Forge pipeline. Read `.forge/<slug>/units.md`; if absent, stop and run `forge-decompose`. Also keep `.forge/<slug>/design.md`, `.forge/<slug>/discovery.md`, `REQUIREMENTS.md` (or the repository's established requirements-document path), and the ADR at hand.

## Pick ready units

A unit is ready only when every dependency is checked off.

- Implement one ready unit or a dependent chain directly, one unit at a time.
- Use parallel agents only for multiple truly independent ready units, with worktree-level isolation and a verification pass for each result.
- Never parallelize units that touch overlapping files or depend on one another.
- Preserve every HITL checkpoint.

## Per unit

1. Implement only the unit's scope.
2. Verify its acceptance criteria and run relevant tests.
3. For each requirement ID in its acceptance criteria, implement the declared normative test title verbatim and update its trace only when the intended behavior changed.
4. Check its box in `units.md`.
5. Commit using the repository's existing conventions.
6. Run the broader project test suite when the affected area warrants it.

Before declaring all units complete, run the full test suite and `node <trace-requirements-skill>/scripts/check-traces.mjs <tests-dir>` without `--progress`. Resolve every accepted missing or drifting trace. Commits and pushes may be autonomous when already authorized. Confirm before opening a pull request, and batch related units at a natural checkpoint unless asked otherwise.

When every unit is checked and the hard trace gate passes, report the build complete and recommend `forge-audit` before a release or after a substantial delivery. Use `forge-status` for progress before then.
