# Workflow transition table

| ID | From → To | Actor | Preconditions / required data | Event |
|---|---|---|---|---|
| T-001 | Draft → Submitted | Product Owner | Required intake fields and documents present | AssessmentSubmitted |
| T-002 | Submitted → Intake Validation | System | Valid submission command | IntakeValidationStarted |
| T-003 | Intake Validation → Clarification Requested | Analyst/System | Missing or ambiguous intake; reason | ClarificationRequested |
| T-004 | Intake Validation → Assessment in Progress | Analyst | Intake complete | IntakeCompleted, AssessmentStarted |
| T-005 | Clarification Requested → Assessment in Progress | Product Owner | Response and evidence supplied | ClarificationResponded |
| T-006 | Assessment in Progress → Clarification Requested | Analyst | Material gap; reason | ClarificationRequested |
| T-007 | Assessment in Progress → Analyst Review | Analyst | Required analysis and calculations complete | AssessmentPrepared |
| T-008 | Analyst Review → Assessment in Progress | Analyst | Rework or new evidence; reason | AssessmentReopened |
| T-009 | Analyst Review → Decision Ready | Analyst | Review complete; recommendation, evidence, gaps, and rationale present | AssessmentDecisionReady |
| T-010 | Decision Ready → Committee Review | FCRM Analyst | Explicit decision-ready handoff confirmed; never automatic | CommitteeReviewStarted |
| T-011 | Committee Review → Final Decision | Risk Committee | Authorized final disposition and rationale; quorum if enabled | CommitteeDecisionFinalized |
| T-012 | Committee Review → Reassessment Requested | Risk Committee | Reason and affected dimensions | ReassessmentRequested |
| T-013 | Final Decision → Closed | System/authorized operator | Decision recorded; conditions resolved or permitted post-close tracking | AssessmentClosed |
| T-014 | Final Decision/Closed → Reassessment Requested | Risk Committee/Analyst | Material-change record and reason | AssessmentVersionCreated |
| T-015 | Reassessment Requested → Assessment in Progress | Analyst | New version created and affected dimensions identified | AssessmentStarted |

Invalid transitions, unauthorized actors, missing justifications, failed preconditions, stale versions, duplicate commands, and closed-record mutation are rejected and audited as attempted actions.
