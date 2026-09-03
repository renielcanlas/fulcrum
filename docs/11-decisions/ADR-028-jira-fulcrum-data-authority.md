# ADR-028 — Jira and FULCRUM data authority boundary

## Status

Accepted

## Context

Jira already provides the business-initiative and collaboration platform used by delivery teams. FULCRUM provides the governed financial-crime assessment, methodology application, human review, final FCRM decision, conditions, and audit lineage. Copying the complete Jira issue model into FULCRUM would create two competing systems of record.

## Decision

Jira remains authoritative for the underlying business initiative and collaboration artifacts: title, description, business context captured in Jira, assignees, Jira workflow metadata, comments, attachments, due dates, related issues, watchers, task execution, and Jira history.

FULCRUM remains authoritative for the financial-crime assessment and decision domain: assessments, assessment versions, accepted facts, extracted facts/provenance, evidence references, risk assessments, controls, deterministic scoring, policy evidence links, AI provenance/recommendations, analyst reviews/overrides, committee reviews/votes, final FCRM decisions, conditions, configuration versions, and audit events.

FULCRUM stores stable Jira correlation IDs, sync/freshness metadata, and selected metadata or content hashes/snapshots only when required for governance, performance, or historical replay. Jira attachments normally remain in Jira. A production banking deployment may add a governed immutable archive for evidence-retention obligations; this is not a general Jira mirror.

## Rejected alternative

Copying Jira issues, comments, attachments, workflow, users, tasks, and history into PostgreSQL was rejected because it creates dual-source-of-truth risk, synchronization conflicts, unnecessary schema and implementation effort, and weaker solo-developer delivery judgment.

## Tradeoffs

FULCRUM depends on Jira availability for current initiative context and normal attachment access. Mitigations are least-privilege OAuth, stable identifiers, selective metadata caching, source timestamps/hashes, bounded evidence snapshots for finalized assessments when required, freshness indicators, reconciliation, and graceful degraded behavior. Jira transitions and webhooks cannot independently create or modify an authoritative FCRM decision.

## Consequences

The physical schema is materially smaller and focused on FCRM state. Initiative, comments, attachments, assignees, and general workflow are represented by external references rather than duplicated aggregates. Assessment evidence links must identify Jira issue/attachment/comment IDs and exact source metadata. FULCRUM must clearly label Jira-sourced context separately from FULCRUM-authoritative conclusions.

## Related decisions

[ADR-002 — Jira OAuth integration](ADR-002-jira-oauth-integration.md), [ADR-005 — Jira and FULCRUM system-of-record boundary](ADR-005-fulcrum-system-of-record.md), [ADR-017 — Managed PostgreSQL authority](ADR-017-managed-postgresql-authority.md), [Evidence & Decision Lineage](../04-domain/evidence-and-decision-lineage.md), and [Domain Model & Entity Relationships](../04-domain/domain-model-and-entity-relationships.md).

