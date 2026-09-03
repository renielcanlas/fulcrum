# ADR-033 — Structured AI task and tool contracts

Status: Accepted

## Context

FULCRUM's bounded AI tasks need predictable inputs, outputs, permissions, provenance, and failure behavior. Free-form model responses and agent-to-agent messages would make evidence lineage, evaluation, and human governance difficult to enforce.

## Decision

Use a shared versioned execution/result envelope, task-specific structured outputs, allowlisted read tools, explicit permission checks, referential and grounding validation, standard error states, idempotent retries, and immutable human dispositions. AI-produced identifiers and claims are untrusted until validated against the authorized context. No AI task has direct database, Jira credential, or authoritative write access.

## Rationale

Structured contracts make the AI layer testable and auditable while keeping implementation small. They preserve the distinction between AI proposals, deterministic calculations, and human decisions without requiring a generic agent framework.

## Consequences

The first implementation should create only the contracts and validators needed for bounded evidence interpretation, risk explanation/drafting, committee-package drafting, and read-only Q&A. Jira actions, autonomous planning, multi-agent protocols, and provider-specific contract variants are deferred.

## Related decisions

[ADR-030](ADR-030-ai-capability-boundary.md), [ADR-031](ADR-031-agent-and-orchestration-boundary.md), [ADR-032](ADR-032-context-engineering-and-rag-boundary.md), and the [agent and tool contracts](../05-ai/agent-and-tool-contracts.md).
