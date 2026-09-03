# Conceptual data model

`ChangeRequest` owns lifecycle, requester, scope, and linked `Product`, `Feature`, `Process`, `Vendor`, `Geography`, and `CustomerSegment`. It has many `Evidence` items, `PolicyReference`s, `AIObservation`s, `AssessmentFinding`s, and assessment versions. `RiskAssessment` contains separate inherent risk, control environment, residual risk, confidence, evidence quality, and completeness; it references `RiskFactor`s, `Control`s, `ScoringParameter` versions, and `Recommendation`s. `CommitteeReview` produces a human `Decision` and may include `HumanOverride`s.

`AgentExecution` records contract/version, inputs, context references, model metadata, output artifact, validation, and escalation. `AuditEvent` is append-only and links all material actions. `Configuration` versions scoring/workflow settings and approval. Ownership, classification, retention, and access policy are attributes on each aggregate; exact classifications are RESEARCH REQUIRED.

Lifecycle: draft → submitted → clarification → analysis → analyst-review → challenge → decision-ready → committee-review → decided → archived/reassessment. Only configured, authorized transitions are valid.
