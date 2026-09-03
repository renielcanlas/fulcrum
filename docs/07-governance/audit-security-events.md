# Audit event model

Audit is append-only and separate from operational telemetry. Every event includes event ID/type, actor and actor type, entity/assessment/version, timestamp, correlation ID, previous/new references, justification when required, and AI run reference when applicable. No raw credentials, tokens, hidden prompts, or unnecessary sensitive content are logged.

Business events include `AssessmentCreated`, `AssessmentSubmitted`, `IntakeValidated`, `ClarificationRequested`, `RiskRatingOverridden`, `AssessmentDecisionReady`, `CommitteeVoteRecorded`, `CommitteeDecisionFinalized`, `ConditionWaived`, and `ConditionClosed`.

Security events include `UserSessionStarted`, `UserSessionEnded`, `UnauthorizedActionRejected`, `JiraConnected`, `JiraDisconnected`, `JiraTokenRefreshed`, `RoleChanged`, and `ConfigurationPermissionRejected`.

AI events include `DocumentExtractionCompleted`, `PolicyRetrievalCompleted`, `RiskRecommendationGenerated`, `AssessmentDraftGenerated`, `AIRecommendationAccepted`, `AIRecommendationEdited`, and `AIRecommendationRejected`.

The audit record must reconstruct what was asked, who asked, what assessment version and context were available, what tools/services were invoked, what was returned, what the model produced, and what humans decided.
