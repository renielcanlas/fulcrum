# FULCRUM canonical entity glossary

These are the names to use in the physical schema, APIs, fixtures, and implementation. A legacy term must not become a second table or aggregate.

| Canonical entity | Meaning |
|---|---|
| `Initiative` | FULCRUM reference/navigation boundary for a Jira-backed business initiative |
| `Assessment` | Stable FCRM assessment identity linked to an initiative |
| `AssessmentVersion` | Complete versioned assessment input, analysis, and decision package |
| `AssessmentFact` | Analyst-accepted fact used by one assessment version |
| `EvidenceReference` | Versioned pointer to Jira, policy, submission, or document evidence |
| `EvidenceLink` | Explicit relationship between evidence and a fact, risk, control, AI artifact, or override |
| `RiskFactorAssessment` | Version-scoped evaluation of one risk factor |
| `ControlAssessment` | Version-scoped applicability and effectiveness assessment of a control |
| `ScoreCalculation` | Immutable deterministic calculation input/output and trace |
| `ConfigurationVersion` | Versioned configuration envelope used by an assessment or calculation |
| `AIRun` | One bounded model execution with context and provider metadata |
| `AIOutputArtifact` | Structured model output or recommendation proposed for human review |
| `HumanDisposition` | Human acceptance, edit, rejection, or override of an AI artifact |
| `AnalystReview` | Analyst review and recommendation for an assessment version |
| `Override` | Explicit human difference from a calculated or AI-proposed value |
| `CommitteeReview` | Review package and governance context for committee decision-making |
| `Vote` | Individual committee member vote on a review package |
| `FinalDecision` | Authoritative committee outcome |
| `ApprovalCondition` | Obligation imposed by a conditional final decision |
| `AuditEvent` | Append-only record of a material action |

## Terms that are aliases or implementation details

| Legacy term | Treatment |
|---|---|
| `ChangeRequest` | Alias for `Initiative`; no separate aggregate |
| `AIObservation` | API/fixture compatibility alias for `AIOutputArtifact` |
| `AgentExecution` | Alias for `AIRun`; no separate agent business entity |
| `AssessmentFinding` | Use `RiskFactorAssessment` or `ControlAssessment` depending on subject |
| `AcceptedFact` | Use `AssessmentFact` |
| `Decision` | Use `FinalDecision` when referring to the authoritative outcome |
| `Condition` | Use `ApprovalCondition` |

The model intentionally does not create a table for every AI task, Jira object, workflow state, or relationship type.
