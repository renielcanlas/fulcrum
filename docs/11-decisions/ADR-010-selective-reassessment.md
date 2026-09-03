# ADR-010: Dependency-aware selective reassessment

Status: Proposed. Requirements: REQ-006, REQ-009, REQ-011.

## Context

Re-running every analysis for a localized change wastes time and can create unrelated churn.

## Decision

Maintain explicit dependencies from inputs to evidence, policies, risk dimensions, calculations, and rationale. Invalidate and recalculate the affected subgraph only; when dependencies are unknown or impact is material/ambiguous, require Analyst review and escalate.

## Consequences

The dependency graph must be versioned and tested. Selective processing improves turnaround and token efficiency but must never omit a material downstream impact.
