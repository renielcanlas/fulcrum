# ADR-034 — AI delivery and evaluation guardrails

Status: Accepted

## Context

Steps 7.5–7.7 require FULCRUM to use model capacity efficiently, measure AI behavior honestly, and resist prompt/tool attacks while remaining feasible for a solo hackathon developer.

## Decision

Use task-specific model routing: fast routes for bounded extraction/gap detection/routine Q&A, stronger reasoning routes for grounded synthesis, and no LLM for authoritative calculations or decisions. Evaluate against synthetic fixtures with measured/simulated/not-measured labels. Enforce bounded calls, active-assessment scope, structured output validation, citation/reference checks, and safe human fallback.

## Consequences

The implementation prioritizes a small read-oriented Copilot vertical slice and defers autonomous agents, Jira write-back, full RAG infrastructure, and distributed orchestration. Provider metadata, token usage, latency, validation, citations, and human dispositions remain observable for evaluation.

## Related decisions

[ADR-030](ADR-030-ai-capability-boundary.md), [ADR-031](ADR-031-agent-and-orchestration-boundary.md), [ADR-032](ADR-032-context-engineering-and-rag-boundary.md), [ADR-033](ADR-033-agent-and-tool-contracts.md), [model routing](../05-ai/model-routing-and-token-strategy.md), and [AI evaluation](../08-testing/ai-evaluation-framework.md).
