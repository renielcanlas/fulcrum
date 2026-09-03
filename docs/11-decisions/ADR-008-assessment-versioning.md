# ADR-008: Version assessments instead of destructive mutation

Status: Proposed. Requirements: REQ-002, REQ-009, REQ-011.

## Context

Material changes can invalidate only some risk dimensions and must not erase reviewed history.

## Decision

Create a new assessment version for a material change, link a `MaterialChange` record, preserve prior artifacts/decisions, and selectively invalidate/recalculate affected dimensions using dependencies. Escalate when impact cannot be determined safely.

## Consequences

Comparisons and storage become more complex, but historical reconstruction and selective reassessment are reliable.
