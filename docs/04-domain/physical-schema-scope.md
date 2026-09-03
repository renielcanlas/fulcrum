# FULCRUM physical schema scope

This is the compact Step 6.4 implementation boundary approved by the data-model resolution pass. It is a schema scope, not yet a migration or ORM implementation.

## Core tables

```text
users
initiatives
jira_links
assessments
assessment_versions
assessment_facts
evidence_references
evidence_links
risk_factor_assessments
control_assessments
score_calculations
configuration_versions
ai_runs
ai_output_artifacts
human_dispositions
analyst_reviews
overrides
committee_reviews
votes
final_decisions
approval_conditions
audit_events
idempotency_keys
```

## Key foreign-key paths

```text
initiative → assessment → assessment_version
assessment_version → assessment_fact → evidence_link → evidence_reference
assessment_version → risk_factor_assessment → evidence_link
assessment_version → control_assessment → evidence_link
assessment_version → score_calculation → configuration_version
assessment_version → ai_run → ai_output_artifact → human_disposition
assessment_version → analyst_review → override
assessment_version → committee_review → vote → final_decision
final_decision → approval_condition
all material aggregates → audit_event
```

## Explicitly excluded from the first schema

- complete Jira issue, comment, attachment, task, watcher, or user mirrors;
- generic graph or universal relationship tables;
- full event sourcing;
- vector chunks and embeddings as authoritative domain records;
- a configuration administration portal;
- automated dependency-graph materiality analysis;
- enterprise tenant administration and retention workflow.

These may be added through adapters or later migrations without changing the authority boundary.

## JSON usage

JSON is allowed for bounded payloads such as calculation traces, configuration content, AI structured output, and context manifests. It must not be the only representation of primary foreign-key relationships, assessment-version ownership, votes, decisions, or audit identity.
