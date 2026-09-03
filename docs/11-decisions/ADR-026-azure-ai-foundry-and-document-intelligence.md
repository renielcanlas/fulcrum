# ADR-026 — Azure AI Foundry and Document Intelligence as the FULCRUM AI platform

## Status

Accepted

## Context

FULCRUM needs governed inference, model routing, embeddings, retrieval, evaluation, and document extraction for initiative assessment. The initial bootstrap documentation treated the public OpenAI API as the primary integration path. Azure AI Foundry and Azure AI Document Intelligence are readily available in the target development environment and provide a better platform boundary for the intended deployment.

## Decision

Use Azure AI Foundry as FULCRUM’s primary AI platform for inference, model routing, prompt execution, embeddings, RAG-related calls, evaluations, and model/version governance. Use Azure AI Document Intelligence as the primary document ingestion and structure-extraction service. Expose both through server-side internal gateways: an AI Gateway for domain capabilities and a Document Processing Gateway for extraction/provenance.

The application remains provider-neutral. Domain services call capabilities such as fact extraction, gap detection, risk analysis, policy retrieval, rationale drafting, committee summarization, and initiative-aware Q&A—not vendor endpoints. The existing `AIProvider` contract and fake provider remain valid compatibility seams.

## Alternatives considered

1. Continue using the public OpenAI API as the primary platform: fast to prototype, but less aligned with the available Azure environment and target enterprise identity/secrets boundary.
2. Call Azure model deployments directly from each feature: simpler initially, but creates coupling, inconsistent governance, and duplicated routing/provenance logic.
3. Use an LLM for document parsing and risk reasoning together: fewer components, but weakens extraction provenance and makes document-processing failures difficult to distinguish from reasoning failures.
4. Build a self-hosted model and OCR stack: maximum control, but disproportionate operational cost and no hackathon advantage.

## Rationale

Azure AI Foundry centralizes model lifecycle and routing while the AI Gateway protects FULCRUM’s domain boundary. Document Intelligence is intentionally separate because extraction and risk reasoning have different quality, audit, retry, and provenance requirements. This preserves the principle: **reuse commodity capabilities; build differentiated financial-crime intelligence**.

## Benefits and tradeoffs

Benefits include Azure-native identity and secret management, configurable model routes, structured document extraction, page/section evidence anchors, evaluation support, and a clear path from synthetic demo to enterprise deployment. Tradeoffs include Azure service dependency, resource/region configuration, deployment-specific testing, possible service quota/cost variation, and the need to maintain an adapter contract for portability.

## Consequences and migration

Add Azure gateway adapters, environment-driven deployment configuration, Document Intelligence processing jobs, normalized evidence schemas, retrieval/indexing, and Azure-specific evaluation/observability. Migrate the previous OpenAI-default documentation and environment names to Azure-primary language. Keep OpenAI-compatible local/test support only where it helps portability; it must not bypass the AI Gateway or human decision gates.

## Related decisions

[ADR-003 — FCRM Copilot and Jira context](ADR-003-fcrm-copilot-and-jira-context.md), [ADR-013 — Bounded AI and provenance](ADR-013-bounded-ai-and-provenance.md), [ADR-018 — Server-side integration gateways](ADR-018-server-side-integration-gateways.md), [ADR-019 — Environment secrets](ADR-019-environment-secrets.md), and [Azure AI architecture](../05-ai/azure-ai-foundry-and-document-intelligence.md).
