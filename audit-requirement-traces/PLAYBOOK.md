# Audit Playbook

Covers the two phases that can't be scripted: semantic cohesion review (requirement smell 5) and exploratory conformance probing. Run the two scripted phases first (`scripts/audit-traces.mjs`, `scripts/requirement-smells.mjs`) — their findings often point at where to spend exploratory time.

## Audit discipline

- **Pin to a commit.** Name it in the report. If the repo changes mid-audit, note what was pinned and what wasn't.
- **Preserve, don't discard, concurrent work.** If uncommitted changes exist when the audit starts, keep them — the audit reads state, it doesn't own the working tree.
- **Temporary tests only.** Exploratory probing may need throwaway integration tests or direct-write scripts to reach suspect paths. Remove them after the results are captured; they are not part of the deliverable.
- **No inline fixes.** The audit reports defects. Fixing them is separate, reviewed work — mixing the two makes it unclear whether a defect was ever really confirmed independently.

## Phase 3 — Semantic cohesion review

For each section (ID prefix) in the requirements doc:

- Does every requirement in this section actually belong to the domain/architecture concern the section name promises? A requirement about retry behavior sitting inside a domain-entity section (e.g. a `TRN-*` reliability requirement inside "Tournament") is a smell — it probably belongs in a `SYS`/`REL`-style section instead, even if the *code* for it lives near the Tournament handler.
- Cross-check section boundaries against `CONTEXT.md` (or the project's glossary) and any ADRs — do the prefixes map onto the domain model's own vocabulary, or did they drift toward implementation structure (e.g. a section per file rather than per concept)?
- Look for requirements that are actually two unrelated concerns joined by "and" at the section level (not just the statement level — a whole ID range can drift this way over time as it accretes edge cases).
- Flag, don't silently move — resectioning requirement IDs is a spec change and goes through the project's requirement-change protocol, not an audit side effect.

## Phase 4 — Exploratory conformance probing

Pick the angles relevant to what this system actually does; not every project has all of these.

- **Authorization boundaries.** For every "protected resource" requirement, attempt the operation as: unauthenticated, authenticated-but-wrong-tenant/non-member, and authenticated-with-expired/malformed credentials. Confirm each is rejected, not just that the happy path succeeds. Include non-HTTP boundaries the spec covers (WebSocket upgrades, background jobs, admin tooling).
- **Persistence invariants.** For every "must not allow X state" requirement, try to create X directly against the datastore (bypassing application validation) or through a second, less-obvious write path (an alarm/cron handler, a bulk-import path, a different endpoint that touches the same table). If the invariant only holds because application code happens to check it, the datastore itself has a gap.
- **Cross-origin / request-forgery checks.** Vary the request properties a same-origin check depends on (missing header, mismatched header, attacker-controlled header) against every mutating endpoint the spec claims is protected.
- **Unimplemented feature families.** Diff the accepted requirement ID prefixes against the actual route/handler inventory. An accepted section with zero matching code paths is a requirements-vs-reality gap, not an edge case — call it out as its own finding rather than folding it into unrelated defects.
- **Contract consistency.** Sample the documented API/error contract (status codes, required headers, response shape) against actual responses for a few representative requests, including ones expected to fail (missing resource, malformed body, wrong method).
- **Lifecycle completeness.** For any component with documented lifecycle behavior (connection close, job cancellation, cleanup on error), exercise the non-happy-path transition directly rather than assuming the happy-path test implies it works.
- **Degraded/misconfigured environment behavior.** For any requirement that says something must "fail closed," actually misconfigure it (undersized secret, missing env var, disabled feature flag) and confirm the failure mode matches — a warning where the spec demands a hard failure is a defect.

## Report template

```md
# Requirements Conformance Audit

Date: {date}
Repository: `{repo}`
Audit reference: commit `{sha}` ({branch})

## Scope and caveat

{What was compared against what. Note any concurrent repo changes and how they were handled. Note that temporary audit tests were removed after execution.}

## Executive summary

{2-4 sentences: how many defects at what severity, and the handful that matter most.}

## Confirmed defects

### 1. {Severity} — {short title}

Requirements: `{IDs}`.

Observed behavior:

- {finding}

Relevant implementation: `{paths}`.

Impact: {who/what is affected and how}.

{repeat, most severe first}

## Requirement smells

{Findings from audit-traces.mjs and requirement-smells.mjs: fan-out, untraced tests, loop/conditional tests, plus Phase 3 semantic-cohesion findings.}

## Verification results

| Check | Result |
| --- | --- |
| `npm test` (or equivalent) | {pass/fail, count} |
| `check-traces.mjs` | {result} |
| `audit-traces.mjs` | {result} |
| `requirement-smells.mjs` | {result} |
| Exploratory probes | {reproduced defects above} |

## Suggested triage order

1. {highest-severity, highest-blast-radius first}
```
