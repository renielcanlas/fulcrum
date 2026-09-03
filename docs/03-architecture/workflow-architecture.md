# Workflow architecture

## State model

The assessment lifecycle is a centralized state machine:

```text
DRAFT → SUBMITTED → INTAKE_VALIDATION → ASSESSMENT_IN_PROGRESS
      → ANALYST_REVIEW → DECISION_READY → COMMITTEE_REVIEW
      → FINAL_DECISION → CLOSED
```

`FINAL_DECISION` is the workflow state. Its required `decisionOutcome` is one of `APPROVED`, `APPROVED_WITH_CONDITIONS`, `DEFERRED`, or `REJECTED`. A final outcome is never inferred from a Jira status or an AI response.

Exceptional paths:

```text
INTAKE_VALIDATION / ASSESSMENT_IN_PROGRESS / ANALYST_REVIEW
    → CLARIFICATION_REQUESTED → ASSESSMENT_IN_PROGRESS

COMMITTEE_REVIEW → REASSESSMENT_REQUESTED → ASSESSMENT_IN_PROGRESS
FINAL_DECISION / CLOSED → REASSESSMENT_REQUESTED → new assessment version
```

The state machine owns actor authorization, preconditions, required justification, event emission, timestamps, and audit payload. UI and AI callers request a transition; neither implements its own conditional state logic.

## Transition contract

Each transition contains `id`, source, target, allowed actor types, precondition predicate, required fields, emitted event, audit requirements, and downstream effects. A rejected transition emits a security/validation diagnostic but does not mutate the assessment. Every accepted transition is idempotent by command/correlation ID.

## Automation classification

| Deterministic | AI-assisted | Human-controlled |
|---|---|---|
| Mandatory fields and document presence | Extract facts and suggest gaps | Correct extracted facts |
| Transition eligibility and authorization | Retrieve policy and regulations | Interpret material risk |
| SLA timestamps and metrics | Suggest risk factors and rationale | Accept/edit/reject drafts |
| Risk/control/residual calculations | Prepare committee summary | Override with rationale |
| Versioning, conditions, quorum | Identify possible material changes | Mark Decision Ready |
| Audit event generation | Summarize and compare | Vote and finalize disposition |

## Governance gates

1. **Intake completeness:** deterministic validation and AI ambiguity detection; Product Owner supplies missing material information and Analyst confirms where required.
2. **Analyst assessment review:** AI prepares; Analyst accepts, edits, rejects, or overrides proposed content and validates evidence, policy, controls, and scoring inputs.
3. **Decision readiness:** Analyst explicitly marks `DECISION_READY`; the system never auto-advances this gate.
4. **Committee decision:** authorized committee members review, vote where configured, and finalize the authoritative outcome.

## Event-driven behavior

Accepted transitions and material commands publish domain events to audit, notifications, AI orchestration, Jira synchronization, analytics, and observability through an event boundary. Consumers are asynchronous and idempotent; none can bypass the workflow state machine.
