# Golden Initiative API and data contracts

These contracts describe the minimum read and command boundaries needed to support the canonical demo. They are proposals for the production API; the current demo exposes equivalent read operations through the governed assessment tool registry.

## Read contracts

| Endpoint | Purpose | Permission boundary |
|---|---|---|
| `GET /api/initiatives/:initiativeId` | Initiative summary, business context, owners, participants, and status | initiative read |
| `GET /api/initiatives/:initiativeId/assessment` | Current assessment version, scores, recommendation, and decision | assessment read |
| `GET /api/initiatives/:initiativeId/risk-factors` | Risk factors and traceability references | risk read |
| `GET /api/initiatives/:initiativeId/evidence` | Evidence metadata, facts, quality, and locators | evidence read |
| `GET /api/initiatives/:initiativeId/controls` | Controls, effectiveness, mitigations, and evidence links | risk read |
| `GET /api/initiatives/:initiativeId/activity` | Comments, status transitions, votes, overrides, and audit references | audit read |
| `GET /api/initiatives/:initiativeId/jira` | Linked Jira work items and freshness/provenance metadata | linked Jira read |

Every response should include stable IDs, `initiativeId`, an assessment/version where relevant, data classification, and provenance. Jira remains an external linked system and does not own FULCRUM risk or decision state.

## AI artifact envelope

```json
{
  "id": "AIO-001",
  "initiativeId": "INIT-2026-0007",
  "assessmentVersion": 1,
  "type": "RISK_RECOMMENDATION",
  "statement": "...",
  "sourceRefs": ["EV-006", "EV-007"],
  "confidence": 0.82,
  "provider": "openai",
  "model": "configured-model",
  "promptVersion": "fcrm-risk-v1",
  "status": "PROPOSED",
  "requiresHumanReview": true
}
```

AI endpoints may create drafts or observations, but must not expose an approve/reject command. The server must validate context access, source references, output schema, and model provenance before persistence.

## Workflow and governance commands

`POST /api/initiatives/:initiativeId/transitions` accepts `{ "to": "DECISION_READY", "expectedVersion": 1, "comment": "..." }` and returns the new state plus an append-only activity/audit event. The state machine validates actor capability and preconditions.

`POST /api/initiatives/:initiativeId/overrides` accepts the original value, new value, reason, evidence references, and expected assessment version. Only an authorized analyst may create it; the original calculated value remains immutable.

`POST /api/initiatives/:initiativeId/committee-decision` accepts the committee outcome, rationale, conditions, and expected version. Only an authorized committee member can finalize it. The command must reject AI-originated actors and must write a decision/audit event.

