# FULCRUM data model resolution

Status: **Resolved for Step 6.4 physical design**.

This document records the decisions approved after the Step 6.6 data-model review. It narrows the conceptual model into an implementable hackathon scope without changing the Jira/FULCRUM authority boundary.

## Decisions

1. `Initiative` is the user-facing FULCRUM reference to a Jira-backed initiative. `Assessment` is the governed FCRM aggregate and `AssessmentVersion` is its historical decision boundary.
2. The canonical entity names are the names in [the entity glossary](canonical-entity-glossary.md). Legacy terms are aliases, not additional aggregates or tables.
3. Jira remains authoritative for initiative and collaboration content. FULCRUM stores correlation metadata and only the evidence metadata, hash, or bounded snapshot needed for governance and replay.
4. Evidence relationships are explicit records, not unvalidated arrays of IDs.
5. One versioned `ConfigurationVersion` envelope is sufficient for the hackathon. Its typed content contains scoring, taxonomy, controls, workflow, material-change, and committee settings. AI instruction/model versions remain pinned on each `AIRun`.
6. A finalized `AssessmentVersion`, its calculations, human review, votes, decision, and historical evidence links are immutable. Corrections create compensating records or a successor version.
7. `FinalDecision` owns the canonical `ApprovalCondition` records. Conditions may link to Jira remediation work but do not become Jira-owned decision records.
8. FULCRUM records separate Jira status, FULCRUM assessment workflow status, and decision outcome.
9. A material change creates a successor assessment version. The first implementation records affected dimensions and invalidated artifacts explicitly; it does not require a generic dependency graph.
10. Audit events are append-only and must commit atomically with consequential FULCRUM commands.

## Canonical status separation

```text
jira_status             = external collaboration state
assessment_status       = stable FULCRUM assessment lifecycle
assessment_version_status = review state for one version
decision_outcome        = committee result
```

For example, an initiative may be `In Progress` in Jira, `COMMITTEE_REVIEW` in FULCRUM, and have a decision outcome of `APPROVED_WITH_CONDITIONS`.

## Required physical invariants

The PostgreSQL design must enforce or transactionally guarantee:

- unique assessment version number per assessment;
- no finalized-version mutation;
- all versioned child records belong to exactly one assessment version;
- one vote per committee member per committee review;
- required rationale for overrides and final decisions;
- valid configuration references for calculations and assessment bindings;
- no evidence link to a missing evidence reference;
- idempotent commands through a unique idempotency key;
- consequential state change and audit event commit together;
- audit events cannot be updated or deleted through normal application access.

## Jira evidence retention rule

- Normal Jira context: retain external issue/comment/attachment identifiers, source timestamps, locator, URL, and freshness metadata.
- Material evidence: retain the source version and content hash where available.
- Finalized evidence that may disappear or change: retain a bounded governed snapshot or archive pointer according to approved retention policy.
- Never mirror the full Jira issue, comment, attachment, user, or task model into FULCRUM.

## Resolution outcome

The model is resolved for compact physical schema design. Production extensions such as WORM audit storage, a full configuration portal, automated impact analysis, and enterprise retention workflows remain documented evolution rather than Step 6.4 blockers.

Related: [canonical entity glossary](canonical-entity-glossary.md), [physical schema scope](physical-schema-scope.md), [Golden fixture mapping](golden-fixture-mapping.md), [ADR-029](../11-decisions/ADR-029-data-model-resolution.md).
