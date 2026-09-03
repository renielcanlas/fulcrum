# ADR-032 — Context engineering and RAG boundary

Status: Accepted

## Context

FULCRUM needs grounded AI assistance across Jira, FULCRUM assessment data, documents, and approved policy sources. Sending all available information to every model call would increase hallucination, authorization, token, and stale-context risk.

## Decision

Use a deterministic `ContextBuilder` to create task-specific, permission-checked, version-aware context packages. Separate source ingestion, retrieval, and generation. Apply metadata filters before semantic retrieval, return bounded cited evidence, validate citations against the retrieved set, and use `UNKNOWN`/human review when evidence is missing or weak. Accepted structured facts are the primary compressed context after human validation.

Jira and documents are untrusted content, not instructions. The model receives no OAuth tokens, direct database access, unrestricted search, or authoritative conversational memory. A small synthetic corpus and lexical retrieval are sufficient for the first implementation; embeddings, reranking, durable caches, and enterprise retrieval infrastructure are production evolution unless the demo proves they are needed.

## Consequences

Every material AI run records source IDs/versions, filters, context manifest, token estimate, citations, and validation. Context can be selectively invalidated when a source, fact, policy, or assessment version changes. Retrieval artifacts remain derived; original sources and finalized FULCRUM records remain authoritative.

## Related decisions

[ADR-026](ADR-026-azure-ai-foundry-and-document-intelligence.md), [ADR-029](ADR-029-data-model-resolution.md), [ADR-030](ADR-030-ai-capability-boundary.md), [ADR-031](ADR-031-agent-and-orchestration-boundary.md), and the [context engineering and RAG design](../05-ai/context-engineering-and-rag-design.md).
