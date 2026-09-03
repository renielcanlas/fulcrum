# Golden Initiative fixture mapping

The canonical fixture is synthetic and remains the first validation source for the physical schema. Each field must be persisted, derived, referenced, or discarded deliberately.

| Fixture area | Physical target | Treatment |
|---|---|---|
| `initiative` identity/context | `initiatives` | Persist FULCRUM reference and selected projection |
| `initiative.jiraLinks` | `jira_links` | Persist external IDs, keys, locators, freshness, and source metadata |
| `initiative.activity` / `stageTimestamps` | `audit_events` plus workflow projection | Persist material FULCRUM events; Jira history remains external |
| `assessment` identity/version/status | `assessments`, `assessment_versions` | Persist stable identity and version-bound state |
| `assessment.evidence` | `evidence_references`, `evidence_links` | Persist source type, ID, locator, facts, hashes/snapshots where required |
| `assessment.evidence[].facts` | `assessment_facts` | Persist accepted facts with provenance and analyst disposition |
| `assessment.riskFactors` | `risk_factor_assessments`, `evidence_links` | Persist factor evaluation and explicit evidence relationships |
| `assessment.controls` | `control_assessments`, `evidence_links` | Persist applicability/effectiveness and mitigation inputs |
| `assessment.riskScores` | `score_calculations` | Persist deterministic inputs, configuration reference, trace, and output |
| `assessment.policies` | `evidence_references` or policy citation records | Persist exact synthetic citation and demo-only classification |
| `assessment.aiObservations` | `ai_runs`, `ai_output_artifacts` | Persist mock provenance; do not claim real model execution |
| `assessment.overrides` | `human_dispositions`, `overrides` | Preserve original AI/system value, human value, actor, rationale, evidence |
| `assessment.analystRecommendation` | `analyst_reviews` | Persist analyst recommendation separately from calculation |
| `assessment.committee` | `committee_reviews`, `votes`, `final_decisions` | Persist package version, members, votes, outcome, rationale |
| `assessment.conditions` | `approval_conditions` | Persist conditions under the final decision, with optional Jira links |
| `assessment.turnaround` | derived reporting projection | Derive from timestamps; store source events rather than duplicated totals |

## Required future fixture additions

Step 6.5 should add a Version 2 reassessment fixture and at least one straightforward approval scenario. The existing Golden Initiative already demonstrates high-risk conditional approval and an analyst override.
