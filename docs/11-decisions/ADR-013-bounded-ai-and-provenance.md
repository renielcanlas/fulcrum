# ADR-013: Bounded AI capabilities and provenance

Status: Proposed. Requirements: REQ-018, REQ-019, REQ-021.

## Decision

AI receives only authorized context and invokes typed backend tools. It may prepare and explain but cannot perform consequential decisions or direct state mutation. Material executions retain reproducibility metadata and human disposition without storing hidden chain-of-thought.

## Rationale and consequence

This keeps probabilistic assistance useful while preserving policy, permission, and examiner boundaries. It requires tool contracts, context manifests, evaluations, and additional audit storage.
