# ADR-023 — Consolidated architecture baseline

## Status

Accepted

## Context

FULCRUM had a coherent set of workflow, AI, security, data, and deployment decisions distributed across many ADRs. The project needed one stable baseline before detailed data-model and feature implementation.

## Decision Drivers

Regulatory traceability, human accountability, deterministic correctness, AI governance, auditability, solo-developer velocity, production portability, security, maintainability, and token efficiency.

## Options Considered

1. Continue with distributed proposed ADRs and resolve contradictions during implementation.
2. Replace the architecture with a new design.
3. Consolidate the existing decisions into one accepted baseline while preserving the individual ADRs as supporting records.

## Decision

Adopt [FULCRUM architecture baseline](architecture-baseline.md) as the accepted source for application boundary, FULCRUM/Jira authority, deterministic/AI/human responsibilities, explicit workflow, evidence-grounded Copilot, bounded capabilities, versioning, immutable audit, Next.js/Vercel deployment, external persistence, and cloud portability. Existing ADRs remain in the repository and are indexed as supporting accepted decisions; this ADR resolves their common status and vocabulary without deleting their history.

## Rationale

The baseline preserves the decisions already made, makes their dependencies visible, identifies implementation gaps, and gives judges and future agents one coherent entry point. It avoids redesign and avoids adding infrastructure merely to make the diagram look more enterprise-grade.

## Consequences

Positive: one reviewable architecture contract, consistent boundaries, easier handoffs, clearer implementation sequencing, and explicit open questions. Negative: the baseline becomes a governance checkpoint; material changes require a new ADR or update and may affect multiple requirements. The current demo remains intentionally incomplete in persistence, live integrations, and production identity.

## Production Evolution

The hackathon uses Next.js/Vercel, synthetic data, environment secrets, demo personas, and in-memory adapters. Production evolves to bank-approved hosting, managed PostgreSQL, durable jobs/sessions/audit, enterprise identity, managed secrets/KMS, enterprise observability, approved data handling, and formal governance review.

## Related Decisions

ADR-000 through ADR-022; especially ADR-005, ADR-006, ADR-007, ADR-013, ADR-014, ADR-017, ADR-018, ADR-019, ADR-020, ADR-021, and ADR-022.
