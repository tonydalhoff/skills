---
name: forge-frame
description: Write a problem statement for a Forge effort before requirements are scoped. Use before forge-crystallize when an idea is solution-led, the affected users are unclear, stakeholders disagree, or the impact is not yet evidenced.
---

# Forge Frame

Optional pre-stage of the Forge pipeline. Use it when the work needs a shared problem statement; skip it when the affected users, evidence, and desired outcome are already clear.

Propose a short kebab-case slug, let the user override it, and create `.forge/<slug>/` if needed. Capture the raw idea and date in `idea.md` without editorializing.

Interview one question at a time. Separate observations from interpretations and the problem statement from a preferred solution. Establish:

- Who experiences the problem and in which situation?
- What observable evidence shows it exists, how often it occurs, and why it matters now?
- What outcome would make the problem meaningfully better?
- What constraints, prior attempts, and stakeholders shape the choice?
- What is explicitly not being claimed or solved yet?

Read [PROBLEM-STATEMENT.md](PROBLEM-STATEMENT.md), then write `.forge/<slug>/problem-statement.md` using that structure.

Do not choose a solution, write normative requirements, or create implementation work here. Tell the user to run `forge-crystallize` next.
