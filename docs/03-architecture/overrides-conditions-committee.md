# Overrides, committee, and conditions

## Overrides

An override is a first-class event containing assessment/version, original value, new value, actor/type, timestamp, mandatory rationale, evidence references, affected downstream calculations, and resulting workflow action. It never rewrites the original system value. A corrected deterministic input triggers selective recalculation; a human final rating difference requires policy-permitted authorization and explicit rationale.

## Committee

The committee receives the decision-ready package, evidence, calculations, unresolved questions, controls, conditions, and override history. Individual votes are optional/configurable and capture member, outcome, timestamp, and comment. The final disposition is a separate authoritative record. `APPROVED`, `APPROVED_WITH_CONDITIONS`, `DEFERRED`, and `REJECTED` are valid outcomes; `REQUEST_REASSESSMENT` routes to a new version rather than becoming a final outcome.

## Conditions

Conditional approval creates an obligation: `OPEN → EVIDENCE_SUBMITTED → VERIFIED`. `OVERDUE` is a derived/operational status and `WAIVED` requires authorized justification and audit history. Each condition has description, owner, due date, evidence, verification actor/time, and links to Jira remediation work where applicable. Conditions do not silently alter the historical committee decision.
