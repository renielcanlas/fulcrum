# Workflow architecture self-review

## Resolved design risks

- `FINAL_DECISION` is distinct from its `decisionOutcome`, preventing state/outcome ambiguity.
- `REQUEST_REASSESSMENT` creates a new version and is not treated as a final disposition.
- Jira is a projection/integration boundary, not a second risk system of record.
- AI cannot advance gates or mutate authoritative state.
- Corrections use events/versions, not destructive updates.

## Ambiguities requiring owner decisions

- Whether committee quorum is required, and which members may vote.
- Whether `CLOSED` may coexist with open conditional-approval obligations or must remain `FINAL_DECISION` until conditions close.
- Whether an Analyst may request reassessment after closure, or only Committee/authorized governance roles.
- Exact SLA business-calendar rules, pause/resume semantics, and breach escalation.
- Whether human final ratings may differ from deterministic ratings and which policy permits it.

## Failure states to model before production

Invalid submission, rejected/expired clarification, stale-version command, duplicate command, failed recalculation, unavailable AI/Jira/policy source, permission revocation, evidence-processing failure, committee quorum failure, overdue condition, failed condition verification, and event delivery/dead-letter failure.

## Architectural risks

Selective invalidation can miss hidden dependencies; mitigate with conservative dependency metadata and Analyst escalation. Eventual consistency can show stale projections; expose freshness and reconcile. AI can overstate confidence; require citations, typed output, and abstention tests. Workflow complexity can grow through exceptions; add new transitions only through ADR and state-machine tests.
