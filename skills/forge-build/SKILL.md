---
name: forge-build
description: Implement units from a forge decomposition sequentially or, for independent work, in isolated parallel worktrees, verifying tests and committing each landed unit. Use after forge-decompose has produced a units checklist.
---

# Forge Build - Execution

Stage 6 of the forge pipeline. Read `.forge/<slug>/units.md`; if absent, stop and run `forge-decompose`. Also keep `.forge/<slug>/design.md` and the ADR at hand.

## Pick ready units

A unit is ready only when every dependency is checked off.

- Implement one ready unit or a dependent chain directly, one unit at a time.
- Use parallel agents only for multiple truly independent ready units, with worktree-level isolation and a verification pass for each result.
- Never parallelize units that touch overlapping files or depend on one another.
- Preserve every HITL checkpoint.

## Per unit

1. Implement only the unit's scope.
2. Verify its acceptance criteria and run relevant tests.
3. Check its box in `units.md`.
4. Commit using the repository's existing conventions.
5. Run the broader project test suite when the affected area warrants it.

Commits and pushes may be autonomous when already authorized. Confirm before opening a pull request, and batch related units at a natural checkpoint unless asked otherwise.

When every unit is checked, report that the pipeline is complete. Use `forge-status` for progress before then.
