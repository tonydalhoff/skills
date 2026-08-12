---
name: forge-status
description: Report where one or all forge efforts stand by inspecting local forge files and ADRs, then name the exact next skill to run. Use when asked what forge work is active, where an effort stopped, or how to resume it.
---

# Forge Status - Pipeline Dashboard

This is a read-only report. Do not create or modify files.

Inspect each `.forge/<slug>/` directory and determine the furthest stage reached:

- A matching dated Forge audit report: audited; pipeline complete.
- All units checked: built; next `forge-audit` before release or when traceability confidence needs re-establishing.
- `units.md` with unchecked units: decomposed; report checked/total and next `forge-build`.
- `design.md`: designed; next `forge-decompose`.
- Matching ADR: decided; next `forge-design`.
- `prototype.md` with `go`: prototyped; next `forge-decide`.
- `prototype.md` with `no-go` or `pivot`: blocked; return to `forge-crystallize` or retry `forge-prototype`.
- `discovery.md` with overall verdict `prototype-ready`: discovered; next `forge-prototype`.
- `discovery.md` with overall verdict `HITL-blocked`, `research-needed`, `pivot`, or `no-go`: blocked; report every unresolved dependency and its required human task or research.
- `brief.md`: crystallized; next `forge-discover`.
- `problem-statement.md`: framed; next `forge-crystallize`.
- `idea.md` only: crystallizing; next `forge-crystallize`.

For one slug, also summarize open questions, prototype evidence, unchecked units and dependencies, requirements coverage (accepted versus proposed and trace-gate result when available), and the reason it is waiting. For all efforts, output one compact line per effort: slug, stage, next command.
