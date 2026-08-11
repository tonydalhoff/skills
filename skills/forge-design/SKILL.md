---
name: forge-design
description: Fabricate a complete design from forge requirements, prototype evidence, and an ADR, covering components, interfaces, data flow, rollout, and risk. Use after forge-decide when an effort needs a concrete design before decomposition.
---

# Forge Design - Design Fabrication

Stage 4 of the forge pipeline. Read `.forge/<slug>/requirements.md`, `.forge/<slug>/prototype.md`, and the matching ADR when one exists. Stop if required inputs are missing.

Default to one strong design written directly. When the design space is genuinely wide, several independent designs may be compared against the requirements' success criteria before synthesizing the strongest result. Keep this exceptional and small.

## Write `.forge/<slug>/design.md`

Cover:

- Overview: components and how they connect.
- Interfaces and contracts: what talks to what, and how.
- Data model changes, if any.
- Sequencing and rollout: phases, feature flags, compatibility, and what ships first.
- Risk and blast radius: likely failures and their reach.
- New hard-to-reverse decisions not already covered by the ADR; flag these explicitly.

Trace every requirements goal to a design element. Flag orphaned requirements and scope creep before calling the design complete.

Tell the user to run `forge-decompose` next.
