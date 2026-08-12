---
name: forge-decide
description: Write an Architecture Decision Record that locks in what a forge prototype proved, including the decision, rationale, and rejected alternatives. Use after a forge prototype reaches a go verdict or whenever a hard-to-reverse, non-obvious trade-off needs permanent documentation.
---

# Forge Decide - Architecture Decision Record

Stage 4 of the Forge pipeline. Read `.forge/<slug>/brief.md`, `.forge/<slug>/discovery.md`, and `.forge/<slug>/prototype.md`; if any is missing, stop and identify the required prior stage.

The ADR is permanent repository documentation, not a file under `.forge/`.

## Confirm an ADR is warranted

An ADR earns its cost when the decision is:

1. Hard to reverse.
2. Surprising without context.
3. The result of a real trade-off.

If none applies, state that and continue to `forge-design` without manufacturing an ADR.

## Write it

Create `docs/adr/` if needed. Choose the next number and write `docs/adr/NNNN-<slug>.md`:

```md
# <Short decision title>

<One to three sentences covering the context, decision, and rationale.>
```

Add only useful optional sections: status, considered options, and non-obvious consequences. Pull rejected options from the prototype evidence.

Tell the user to run `forge-design` next.
