---
name: forge-status
description: Report where one or all forge efforts stand by inspecting local forge files and ADRs, then name the exact next skill to run. Use when asked what forge work is active, where an effort stopped, or how to resume it.
---

# Forge Status - Pipeline Dashboard

This is a read-only report. Do not create or modify files.

Inspect each `.forge/<slug>/` directory and determine the furthest stage reached:

- `idea.md` only: crystallizing; next `forge-crystallize`.
- `requirements.md`: crystallized; next `forge-prototype`.
- `prototype.md` with `go`: prototyped; next `forge-decide`.
- `prototype.md` with `no-go` or `pivot`: blocked; return to `forge-crystallize` or retry `forge-prototype`.
- Matching ADR: decided; next `forge-design`.
- `design.md`: designed; next `forge-decompose`.
- `units.md` with unchecked units: decomposed; report checked/total and next `forge-build`.
- All units checked: built; pipeline complete.

For one slug, also summarize open questions, prototype evidence, unchecked units and dependencies, and the reason it is waiting. For all efforts, output one compact line per effort: slug, stage, next command.
