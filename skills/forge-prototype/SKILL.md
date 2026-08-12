---
name: forge-prototype
description: Build a throwaway proof of concept that tests the riskiest technical assumption in a discovery-vetted Forge effort using a falsifiable hypothesis, time-box, and evidence-based verdict. Use after forge-discover when a feature or architecture change rests on an unproven technical assumption.
---

# Forge Prototype - Proof of Concept

Stage 3 of the Forge pipeline. Read `.forge/<slug>/brief.md` and `.forge/<slug>/discovery.md`; if either is missing, stop and run its required prior stage. Proceed only when the discovery record's overall verdict is `prototype-ready`.

## Discipline

1. Restate the riskiest assumption as a hypothesis that can fail.
2. Set a time-box before starting and hold to it.
3. Write only enough disposable code to prove or disprove the hypothesis. Avoid production hardening and unrelated cleanup.
4. Isolate the work in a scratch directory, disposable branch, or worktree so it cannot leak into the main branch accidentally.
5. Measure evidence: output, timings, error messages, or a before/after diff. "Seemed fine" is not evidence.
6. If the assumption is already proven by a well-established local pattern, document that evidence instead of manufacturing a prototype.

When several genuinely plausible approaches deserve testing, they may be prototyped independently and compared. Keep the fan-out small and use equivalent filesystem isolation.

## Write the verdict

Write `.forge/<slug>/prototype.md` with:

- Hypothesis and rationale
- Approaches tried
- Evidence
- Verdict: `go`, `no-go`, or `pivot`
- What is now known and what remains unknown

For `no-go` or `pivot`, do not proceed; revise the requirement or test another approach. For `go`, tell the user to run `forge-decide` next.
