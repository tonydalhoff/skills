---
name: forge-decompose
description: Break a forge design into independently implementable and reviewable tracer-bullet units with acceptance criteria, dependencies, and HITL or AFK markings. Use after forge-design to create a sequence of shippable work units.
---

# Forge Decompose - Unit Decomposition

Stage 5 of the forge pipeline. Read `.forge/<slug>/design.md`; if it is missing, stop and run `forge-design` first.

## Good units

- Slice vertically through every touched layer rather than separating API, UI, schema, and tests.
- Are demoable or verifiable independently.
- Fit in one reviewable pull request; split further when they do not.
- State acceptance criteria that another reviewer can check without asking the author.
- Declare dependencies so units can be ordered or parallelized correctly.
- Mark `HITL` when a human decision or review is genuinely needed; otherwise mark `AFK`.
- Call out high blast radius.

Draft units section by section from the design, then make a fresh completeness pass for missing design elements, hidden dependencies, oversized units, and false independence.

Write `.forge/<slug>/units.md`:

```md
- [ ] U1: <name> - <one-line scope> - AFK (depends on: none)
  - Acceptance: <how to verify the unit is done>
- [ ] U2: <name> - <one-line scope> - HITL (depends on: U1)
  - Acceptance: <how to verify the unit is done>
```

If external tickets are needed, hand the finished units to `to-issues`. Tell the user to run `forge-build` next.
