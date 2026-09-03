# ADR-003: FCRM copilot with Jira initiative context

Status: Accepted. Requirements: REQ-005, REQ-009, REQ-010, REQ-016, REQ-017, REQ-018, REQ-019. Related: ADR-000 and ADR-002.

## Context

FCRM needs AI assistance for assessment preparation and a chatbot that can explain a Jira-backed initiative using FULCRUM assessment records and authorized Jira business/collaboration context. Jira owns the underlying initiative; FULCRUM owns the risk assessment and decision record.

## Decision

Implement a read-first FCRM Copilot behind the AI gateway and orchestrator. A deterministic context assembler obtains only explicitly linked, permission-checked, reconciled Jira projections and combines them with FULCRUM case context. The assistant and agents produce cited, typed, reviewable artifacts. The scoring engine, authorization, workflow, audit, and committee decision remain deterministic/human-controlled. Any future write action is a separate capability with its own scope, confirmation, authorization, idempotency, and audit contract.

## Alternatives

An unrestricted chatbot over a Jira account; direct model calls from the browser; or a model that writes assessment state. These approaches create excessive data exposure, weak provenance, and unacceptable governance risk.

## Consequences

The product gains an analyst-friendly conversational surface and shared initiative context, but must operate projection freshness, access filtering, citation/grounding evaluation, model cost controls, and explicit handling of unknowns. Jira context must be linked and reconciled before it is used in a material explanation.
