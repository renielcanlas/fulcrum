# ADR-030 — AI capability boundary

Status: Accepted

## Context

FULCRUM needs useful AI assistance for intake, evidence interpretation, risk analysis, and conversational support without allowing probabilistic output to become an FCRM decision. The Step 7.1 capability review evaluated the full lifecycle against hackathon value and solo-developer feasibility.

## Decision

Use AI for bounded interpretation, retrieval assistance, summarization, semantic comparison, drafting, and read-only initiative-aware Q&A. Keep validation, authorization, workflow, scoring, configuration activation, vote/decision enforcement, and audit generation deterministic. Require human review for every material FCRM conclusion. Use one bounded orchestrator and typed tools; do not introduce autonomous decision agents or Jira write-back agents for the hackathon.

Azure AI Document Intelligence is the document-structure extraction target. Azure AI Foundry model deployments are the reasoning, drafting, and conversational target through the AI Gateway. The current fake/OpenAI-compatible provider remains a test/demo adapter only.

## Rationale

This places AI where semantic interpretation adds value while preserving reproducibility, human accountability, evidence lineage, and a reliable demo path. It also avoids implementing disconnected agents that would increase token cost and governance risk without improving the judged outcome.

## Consequences

The first demo prioritizes grounded analyst Q&A, missing-information detection, evidence-backed risk explanation/drafting, committee-package generation, and visible provenance/override handling. Automatic approvals, AI scoring, generic multi-agent collaboration, Jira mutations, and AI-generated audit events are deferred.

## Related decisions

[ADR-000](ADR-000-initial-architecture.md), [ADR-026](ADR-026-azure-ai-foundry-and-document-intelligence.md), [ADR-029](ADR-029-data-model-resolution.md), and the [AI capability map](../05-ai/ai-capability-map.md).
