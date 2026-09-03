# Event catalogue and SLA model

## Events

`AssessmentSubmitted`, `IntakeValidationStarted`, `IntakeCompleted`, `ClarificationRequested`, `ClarificationResponded`, `AssessmentStarted`, `AssessmentPrepared`, `AssessmentReopened`, `AssessmentRecalculated`, `AnalystOverrideRecorded`, `AssessmentDecisionReady`, `CommitteeReviewStarted`, `CommitteeVoteRecorded`, `CommitteeDecisionFinalized`, `ReassessmentRequested`, `AssessmentVersionCreated`, `ConditionCreated`, `ConditionEvidenceSubmitted`, `ConditionVerified`, `ConditionWaived`, and `AssessmentClosed`.

Every event contains entity/assessment ID, version, type, actor/type, previous/new state, timestamp, justification, input/output references, correlation ID, and AI model/run reference when relevant. The audit event is append-only; projections may be rebuilt.

## Timestamps and derived metrics

Capture `createdAt`, `submittedAt`, `intakeStartedAt`, `intakeCompletedAt`, `assessmentStartedAt`, `clarificationRequestedAt`, `clarificationRespondedAt`, `analystReviewStartedAt`, `decisionReadyAt`, `committeeReviewStartedAt`, `decisionAt`, and `closedAt`, allowing multiple clarification cycles as a timestamped collection.

Derive total turnaround, Product Owner wait, Analyst handling, committee wait, AI processing, time in state, clarification count, override count, reassessment count, and condition aging. FULCRUM is the canonical metric source; Jira contributes execution context only.
