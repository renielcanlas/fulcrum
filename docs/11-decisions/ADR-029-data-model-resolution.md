# ADR-029 — Data model resolution for physical schema design

Status: Accepted

## Context

The Step 6 conceptual model covered the required FCRM lifecycle, but review identified overlapping names, unclear physical boundaries, and a risk of duplicating Jira data or storing lineage only in JSON arrays.

## Decision

Adopt the compact FULCRUM schema scope and canonical vocabulary defined in the [data model resolution](../04-domain/data-model-resolution.md). `AssessmentVersion` is the immutable historical decision boundary. Evidence relationships are explicit records. Jira remains authoritative for initiative and collaboration content. FULCRUM owns governed assessment, risk, decision, condition, configuration, AI provenance, and audit state.

Use one versioned configuration envelope for the hackathon, with AI model/instruction versions pinned per `AIRun`. Finalized records are immutable and consequential commands commit atomically with append-only audit events.

## Rationale

This preserves examiner reconstruction and historical replay while keeping the physical implementation feasible for a solo hackathon developer. It avoids a full Jira mirror, graph database, and premature event-sourcing system.

## Consequences

The first schema must include explicit foreign keys, version isolation, vote uniqueness, idempotency, and audit constraints. JSON remains available for bounded traces and provider payloads but cannot replace primary relationships. Production archival, WORM audit, enterprise identity, and automated material-change analysis remain later evolution.

## Related decisions

[ADR-024](ADR-024-initiative-as-primary-domain-object.md), [ADR-025](ADR-025-canonical-golden-initiative-fixture.md), [ADR-027](ADR-027-version-binding-and-configuration-lifecycle.md), and [ADR-028](ADR-028-jira-fulcrum-data-authority.md).
