# ADR-007: Immutable workflow history

Status: Proposed. Requirements: REQ-007, REQ-009.

## Context

Assessments may be examined months after changes, overrides, or decisions.

## Decision

Material actions append immutable events with actor, prior/new values, version, references, justification, and correlation data. Corrections create compensating events or new versions; they never rewrite history.

## Consequences

Audit storage and export require retention/access controls. Projections can be rebuilt, but event schemas and integrity controls must be governed.
