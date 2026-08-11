---
name: forge-crystallize
description: Turn a raw idea into a crystallized requirements document covering the problem, goals, non-goals, constraints, riskiest assumptions, and success criteria. Use when a new feature, architecture change, or idea needs scoping before code is written.
---

# Forge Crystallize - Requirement Surfacing

Stage 1 of the forge pipeline:

`forge-crystallize -> forge-prototype -> forge-decide -> forge-design -> forge-decompose -> forge-build`

`forge-status` reports where an effort stands.

## Shared conventions

- Give each effort a short kebab-case slug derived from the idea.
- Keep working state in `.forge/<slug>/`. This directory is local working state and may be gitignored.
- Write stage files in order: `idea.md`, `requirements.md`, `prototype.md`, the repository ADR, `design.md`, then `units.md`.
- Stop when a required upstream file is absent and identify the stage that must run first.

## Process

1. Propose a slug, let the user override it, and create `.forge/<slug>/`.
2. Capture the user's words, today's date, and immediately obvious context in `idea.md`. Do not editorialize.
3. Interview one question at a time. Offer a recommended answer when the codebase or available evidence supports one.
4. Cover, in order:
   - Problem: what is broken or missing, and why now?
   - Goals: what concrete result defines success?
   - Non-goals: what is explicitly outside the effort?
   - Constraints: technical, compliance, deadline, and organizational boundaries.
   - Success criteria: what observable result proves this worked?
   - Riskiest assumptions: expensive technical bets that could be disproved early.
   - Blast radius: the worst case and what it touches.
5. Write those sections to `.forge/<slug>/requirements.md`.
6. Do not skip the prototype gate when a risky assumption remains.

Tell the user to run `forge-prototype` next.
