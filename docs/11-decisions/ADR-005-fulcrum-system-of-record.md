# ADR-005: Jira and FULCRUM system-of-record boundary

Status: Accepted. Requirements: REQ-001, REQ-009, REQ-017.

## Context

Jira already owns the underlying business initiative and collaboration lifecycle. FULCRUM adds the governed financial-crime assessment, methodology application, human review, decision, conditions, and audit lineage. Treating either platform as authoritative for both domains would create unnecessary duplication and synchronization risk.

## Decision

Jira is authoritative for the underlying business initiative and collaboration artifacts: title, description, business context captured there, assignees, Jira workflow metadata, comments, attachments, due dates, related issues, task execution, watchers, and Jira history.

FULCRUM is authoritative for the financial-crime risk assessment and decision lineage: Assessment, AssessmentVersion, accepted assessment facts, extracted facts and provenance, evidence references, risk dimensions/factors, deterministic calculations, controls and effectiveness assessments, policy/regulatory citations, AI runs and recommendations, analyst reviews/overrides, committee reviews/votes, final FCRM decisions, approval conditions, configuration versions, and append-only audit events.

FULCRUM stores Jira correlation/sync metadata and only the selected Jira-backed evidence metadata or historical snapshot needed for governance, performance, or reproducibility. It does not copy the complete Jira issue, comment, attachment, or workflow model.

## Alternatives

Copy the complete Jira issue model into FULCRUM, use FULCRUM as the master for business initiative data, or maintain dual ungoverned masters. The first duplicates Jira; the latter two create authority and synchronization ambiguity.

## Consequences

FULCRUM depends on Jira for some initiative context and attachment availability. The integration therefore needs stable IDs, scoped OAuth, freshness/sync metadata, selective caching, source hashes/snapshots for finalized evidence where required, reconciliation, and graceful degraded behavior. Jira workflow transitions cannot independently create or modify an FCRM decision.
