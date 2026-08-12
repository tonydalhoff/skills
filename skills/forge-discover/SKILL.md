---
name: forge-discover
description: Vet external dependencies and their prototype paths for a Forge effort, covering APIs, access, secrets, integrations, and deployment platforms. Use after forge-crystallize and before forge-prototype when outside systems could block or constrain the work.
---

# Forge Discover

Stage 2 of the Forge pipeline. Read `.forge/<slug>/brief.md` and `REQUIREMENTS.md` (or the repository's established requirements-document path). If either is missing, stop and run `forge-crystallize` first.

Establish whether the effort is prototype-ready before code is written. Do not provision credentials, modify third-party systems, or store secrets. Those are explicit human-owned tasks unless already authorized.

1. Inventory every system outside the repository that the effort could touch: APIs, services owned by other teams, deployment platforms, identity providers, data stores, and operational tooling.
2. For each dependency, use primary documentation and local configuration to establish:
   - owner, purpose, integration point, and authoritative documentation;
   - candidate approaches and a fallback where one is plausible;
   - authentication, required privileges, sandbox or test-tenant availability, and expected access path;
   - health, readiness, heartbeat, or failure-reporting contract when the integration is long-lived or operational;
   - secret destination, deployment constraints, migration/cutover requirements, and rollback path;
   - the cheapest credible prototype route: local fake, vendor sandbox, test tenant, already-authorized environment, or a human task.
3. Use `research` for facts that require external documentation. When unresolved external decisions make the route unclear, create a decision map rather than guessing. Use `wizard` only after a human has approved a repeatable manual provisioning or cutover procedure.

Write `.forge/<slug>/discovery.md`:

```md
# Dependency discovery

## <Dependency name>

- Owner and purpose:
- Evidence:
- Options considered:
- Chosen prototype route:
- Auth, access, and sandbox:
- Health or operational contract:
- Secrets and deployment:
- Open risks and assumptions:
- Verdict: prototype-ready | HITL-blocked | research-needed | pivot | no-go
- Required human task: <none, or the smallest action that unblocks the route>

## Overall verdict

prototype-ready | HITL-blocked | research-needed | pivot | no-go
```

Every dependency needs evidence and a verdict. The overall verdict is `prototype-ready` only when every dependency has a concrete, authorized prototype route. A required human task must name the owner, requested access or action, destination for any secret, and completion evidence.

For `HITL-blocked`, `research-needed`, `pivot`, or `no-go`, stop here; do not start the prototype. For `prototype-ready`, tell the user to run `forge-prototype` next.
