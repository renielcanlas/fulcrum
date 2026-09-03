# Golden Initiative demo scenario

Status: canonical synthetic demo fixture. This scenario is for presentation, evaluation, and development only; it contains no real customer, bank, partner, or regulatory data.

The fixture is [golden-initiative.json](../../data/demo/golden-initiative.json). It is deliberately represented as a generic `Initiative` with configurable type values, rather than as a remittance-specific code path.

## Scenario

Maya Chen proposes **Launch U.S.–Philippines Instant Remittance**, a new product launch and geographic expansion. The service allows eligible U.S. customers to send funds through mobile and web channels to recipients in the Philippines using the synthetic local partner HarborBridge Payments Philippines. The forecast is 120,000 monthly transactions and $18 million monthly value, with a synthetic initial limit of $1,000.

The open information includes partner beneficial ownership, partner screening evidence, alert-handling ownership and SLA, and recipient-wallet limits. Daniel Reyes assesses the initiative. Helen Morgan makes the committee decision. The result is **Approved with Conditions**.

## Domain records and relationships

```text
Initiative
├── business context, participants, owner, Jira links, comments, activity
├── AssessmentVersion
│   ├── RiskFactor[] ──factRefs──> Evidence[]
│   │                  └─controlRefs──> Control[]
│   ├── PolicyReference[]
│   ├── AIObservation[] ──sourceRefs──> Evidence[]
│   ├── HumanOverride[] ──evidenceRefs──> Evidence[]
│   ├── AnalystRecommendation
│   └── CommitteeReview ──> Decision
└── Condition[] ──may link──> JiraWorkItem
```

The explainability path is explicit: risk factor → initiative fact/evidence → synthetic policy reference → control → versioned scoring configuration → AI rationale → analyst decision/override → committee outcome. A production implementation should require every material finding to resolve this path before it becomes decision-ready.

## Workflow and timing

The presentation workflow is:

`Draft → Submitted → Information Gathering → FCRM Assessment → Analyst Review → Decision Ready → Committee Review → Approved with Conditions`

The existing engine retains its canonical states and maps the presentation labels as follows:

| Demo label | Engine boundary |
|---|---|
| Information Gathering | `INTAKE_VALIDATION` and clarification activity |
| FCRM Assessment | `ASSESSMENT_IN_PROGRESS` |
| Analyst Review | `ANALYST_REVIEW` |
| Decision Ready | `DECISION_READY` |
| Committee Review | `COMMITTEE_REVIEW` |
| Approved with Conditions | decision outcome plus `CONDITION_TRACKING` |

The fixture records current owner, participants, decision maker, stage timestamps, activity, clarification cycles, overrides, and total turnaround. Its canonical lifecycle interpretation is `initiative=DECIDED`, `assessment=FINAL_DECISION`, `decision=APPROVED_WITH_CONDITIONS`, and `conditions=OPEN`; it is not closed while conditions remain unresolved. It intentionally contains one clarification cycle and one analyst override.

## Risk assessment

The assessment includes findings for money laundering, terrorist financing, sanctions, fraud, geographic exposure, customer, product/service, transaction, delivery channel, third-party/vendor, and control effectiveness. Each finding has a rating, rationale, evidence references, and control references. Inherent risk, control environment, residual risk, scoring thresholds, rule identifier, and configuration version are separate fields.

The demo calculator uses versioned configuration `FULCRUM-SYNTH-CONFIG-1.2`: factor values produce an inherent score, control effectiveness produces a mitigation value, and thresholds produce the residual rating. The system-calculated residual risk is synthetic `HIGH` (score 78). Daniel’s finalized recommendation is `MEDIUM` for a bounded launch because documented controls mitigate part of the exposure. The distinction is intentional: an analyst recommendation is not allowed to silently overwrite the deterministic calculation.

## AI and human governance demonstration

The dataset supports intake summarization, structured extraction, missing-information detection, risk-factor identification, policy retrieval, evidence/control mapping, draft assessment and rationale, initiative-aware Q&A, and committee-summary generation. AI observations are artifacts with confidence, source references, status, and provenance; they are not decisions.

`AIO-001` recommends `HIGH` residual risk because partner diligence and enhanced-monitoring evidence are incomplete. Daniel overrides that suggestion to `MEDIUM`, records the rationale and evidence used, and leaves the system-calculated `HIGH` value visible. Helen then records the final committee outcome. This creates a demonstrable human-governance trail rather than an autonomous approval.

## Synthetic approval conditions

The committee’s demo-only conditions are enhanced transaction monitoring, lower initial transaction limits, additional HarborBridge due diligence, and a 30-day post-launch FCRM review. Conditions have owners, due dates, status, and Jira links where applicable. They are obligations to verify, not evidence that the controls are already complete.

## Extensibility rule

New initiative types should populate the same generic records and contracts: business context, facts, evidence, risk factors, controls, assessment versions, review, decision, and conditions. Type-specific fields belong in validated, versioned extensions or configuration. Do not add remittance-specific branches to workflow, authorization, scoring, or AI orchestration.
