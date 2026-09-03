# ADR-005: FULCRUM is the FCRM system of record

Status: Accepted. Requirements: REQ-001, REQ-009, REQ-017.

## Context

Jira is valuable for engineering execution but does not own financial-crime assessment decisions.

## Decision

FULCRUM owns lifecycle, risk, scoring, evidence, controls, AI recommendations, overrides, committee votes, decisions, versions, and audit. Jira receives explicit projections/links for work items, actions, comments, and conditions. Synchronization is auditable and cannot silently mutate risk state.

## Alternatives

Jira as the master record, or dual ungoverned masters. These weaken domain ownership and examiner reconstruction.

## Consequences

The integration needs correlation IDs, reconciliation, source provenance, and conflict handling. FULCRUM must expose the status/decision views users need rather than relying on Jira.
