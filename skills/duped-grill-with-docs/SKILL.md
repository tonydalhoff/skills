---
name: duped-grill-with-docs
description: Run a relentless design interview against the existing domain model while sharpening terminology and recording glossary entries and ADRs as decisions crystallize. Use when a user wants to stress-test a plan against project context and preserve the resulting decisions.
---

# Grill With Docs (Imported Duplicate)

Interview relentlessly until the plan reaches shared understanding. Walk each branch of the design tree and resolve dependencies between decisions one at a time. Ask one question at a time, wait for the answer, and include a recommended answer. Explore the codebase when evidence can answer a question.

## Domain awareness

Look for existing documentation while exploring. The glossary lives at `GLOSSARY.md`; ADRs live under `docs/adr/`. Create either lazily, only when the first entry is ready.

### During the session

- Challenge language that conflicts with `GLOSSARY.md` immediately.
- Replace vague or overloaded terms with precise canonical terms.
- Probe domain relationships with concrete edge-case scenarios.
- Cross-reference code when the user describes how something works and surface contradictions.
- Update `GLOSSARY.md` inline as terms resolve, using [GLOSSARY-FORMAT.md](GLOSSARY-FORMAT.md). Keep implementation details out of the glossary.

### Offer ADRs sparingly

Offer an ADR only when the decision is meaningful to future readers, surprising without context, and the result of a real trade-off. If all three apply, use [ADR-FORMAT.md](ADR-FORMAT.md).
