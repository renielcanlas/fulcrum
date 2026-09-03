# ADR-031 — Bounded AI orchestration boundary

Status: Accepted

## Context

Step 7.1 identified useful AI capabilities but also the risk of turning every capability into an autonomous agent. FULCRUM needs traceable, permission-aware assistance that pauses for analyst and committee decisions and remains feasible on a serverless hackathon stack.

## Decision

Use one deterministic `AssessmentOrchestrator` to coordinate typed AI tasks, deterministic services, execution state, retries, provenance, and human checkpoints. Do not require autonomous agents for the hackathon. The conversational assistant uses bounded read tools and cannot mutate authoritative state. Consequential commands continue through normal authorization, workflow, concurrency, idempotency, and audit paths.

## Rationale

The proposed tasks do not need autonomous decomposition, persistent private memory, or iterative multi-tool planning. Fewer components reduce token waste, failure modes, and implementation risk while preserving the strongest judging story: context engineering, grounding, structured outputs, human governance, and deterministic scoring.

## Consequences

Evidence interpretation, policy synthesis, risk observations, assessment drafting, version comparison, committee-package drafting, and Q&A are bounded AI tasks. Jira, Document Intelligence processing, retrieval filtering, scoring, workflow, authorization, and audit remain deterministic services. Durable queues and workers are production evolution rather than hackathon prerequisites.

## Related decisions

[ADR-026](ADR-026-azure-ai-foundry-and-document-intelligence.md), [ADR-029](ADR-029-data-model-resolution.md), [ADR-030](ADR-030-ai-capability-boundary.md), and the [agent and orchestration design](../05-ai/agent-and-orchestration-design.md).
