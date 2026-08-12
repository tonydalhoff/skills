---
name: forge-crystallize
description: Turn a raw idea into a scoped Forge brief and a traceable `REQUIREMENTS.md` with normative planned tests. Use when a new feature, architecture change, or idea needs scoping before code is written.
---

# Forge Crystallize - Requirement Surfacing

Stage 1 of the Forge pipeline. `forge-frame` may precede it when the problem needs definition; otherwise start here.

`forge-frame? -> forge-crystallize -> forge-discover -> forge-prototype -> forge-decide -> forge-design -> forge-decompose -> forge-build -> forge-audit`

`forge-status` reports where an effort stands.

## Shared conventions

- Give each effort a short kebab-case slug derived from the idea.
- Keep working state in `.forge/<slug>/`. This directory is local working state and may be gitignored.
- Write stage files in order: `idea.md`, optional `problem-statement.md`, `brief.md`, `discovery.md`, `prototype.md`, the repository ADR, `design.md`, then `units.md`.
- `REQUIREMENTS.md` (or the repository's established requirements-document path) is the durable normative contract. `.forge/<slug>/brief.md` is the effort brief: its problem, goals, constraints, assumptions, and success criteria explain the contract but do not replace it.
- Stop when a required upstream file is absent and identify the stage that must run first.

## Process

1. Propose a slug, let the user override it, and create `.forge/<slug>/`.
2. Capture the user's words, today's date, and immediately obvious context in `idea.md` when it does not already exist. If `problem-statement.md` exists, use it as the problem input and do not re-interview settled framing questions.
3. Interview one question at a time. Offer a recommended answer when the codebase or available evidence supports one.
4. Cover, in order:
   - Problem: what is broken or missing, and why now?
   - Goals: what concrete result defines success?
   - Non-goals: what is explicitly outside the effort?
   - Constraints: technical, compliance, deadline, and organizational boundaries.
   - Success criteria: what observable result proves this worked?
   - Riskiest assumptions: expensive technical bets that could be disproved early.
   - Blast radius: the worst case and what it touches.
5. Write those sections to `.forge/<slug>/brief.md`.
6. Create or extend `REQUIREMENTS.md` using the `trace-requirements` document grammar:
   - Use the project's domain vocabulary and 2--6 letter mnemonic prefixes.
   - Write one observable `The application must...` behavior per requirement; include explicit out-of-scope items.
   - Give every requirement a stable ID and an exact, planned normative test title beginning with that ID. Choose the test level from the behavior, not the implementation.
   - Mark requirements **[PROPOSED]** until their decision is confirmed. Surface implied behaviors and unresolved decisions rather than silently accepting them.
   - Preserve existing requirement IDs and their trace lines; a changed decision rewrites or supersedes a requirement rather than reusing its ID.
7. Run `node <trace-requirements-skill>/scripts/check-traces.mjs --progress <tests-dir>` against the document. This is the bootstrap report: planned tests may not exist yet, but invalid document grammar and trace drift must be visible.
8. Do not skip the prototype gate when a risky assumption remains.

Tell the user to run `forge-discover` next.
