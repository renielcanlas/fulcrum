# FULCRUM model routing and token strategy

Status: **Step 7.5 — resolved**.

Model selection is configuration-driven and task-specific. No model is authoritative for scoring, workflow, authorization, configuration activation, voting, or audit. Azure AI Foundry is the target provider; the current OpenAI-compatible adapter and fake provider remain portability/demo seams.

## Routing matrix

| Capability | Route | Reason | Context | Fallback |
|---|---|---|---|---|
| Required-field validation | No LLM | Exact rules are cheaper and reproducible | Small deterministic input | Manual validation |
| Document OCR/layout/forms/tables | Azure Document Intelligence | Specialized document structure extraction | Selected document/version | Manual document review |
| Jira field normalization and short summary | Fast model | Low-complexity structured transformation | Selected fields/comments | Show source Jira data |
| Candidate fact extraction | Fast model initially; reasoning route only for ambiguous documents | Structured extraction with limited ambiguity | Selected spans/tables and schema | Analyst entry/review |
| Missing-information detection | Fast model | Gap classification and question drafting | Accepted facts plus evidence gaps | Deterministic checklist |
| Policy retrieval | No LLM for filtering; optional fast model for query reformulation | Retrieval identity and filters must be deterministic | Query and metadata | Keyword search |
| Policy synthesis | Reasoning model | Multi-source grounded synthesis requires stronger reasoning | Top 3–5 approved passages | Show passages and escalate |
| Risk-factor suggestions | Reasoning model for material analysis | Cross-factor interpretation and contradiction detection | Accepted facts, taxonomy, score, evidence | Analyst checklist |
| Risk scoring | No LLM | Formula, thresholds, and reproducibility | Pinned facts/configuration | Manual review |
| Control-gap suggestions | Fast model; reasoning only for complex conflicts | Mostly structured semantic mapping | Relevant controls/evidence | Control checklist |
| Assessment drafting | Reasoning model for final narrative; fast model for short sections | Coherent synthesis over governed inputs | Accepted facts, calculations, citations | Template report |
| Change impact summary | Fast model for simple diff; reasoning for semantic materiality explanation | Structured diff first, language second | Prior/current diff and deterministic impacts | Structured diff |
| Committee package | Reasoning model with bounded finalized context | High-value synthesis, not decision | Finalized assessment package | Deterministic report |
| Conversational Q&A | Fast model by default; reasoning route for multi-source explanation | Most questions are read-only and scoped | Intent-specific tool results | Direct read screens |

## Routing rules

1. Use deterministic code when the result is a validation, lookup, permission, formula, threshold, state transition, or audit fact.
2. Use the fast route for small structured tasks with low ambiguity and bounded context.
3. Use the reasoning route when multiple evidence sources must be reconciled or a material analyst-facing explanation is required.
4. Escalate to the reasoning route only after deterministic filtering and context reduction.
5. Record task contract, provider, deployment, model/version, context version, token usage, latency, and validation result for every material run.
6. A route failure never changes the authority class of the task or bypasses a human gate.

## Token strategy

| Control | Implementation rule |
|---|---|
| Accepted-fact compression | Prefer accepted structured facts over repeatedly sending raw documents |
| Retrieval bounds | Apply metadata filters, then return top 3–5 passages for synthesis |
| Context deduplication | De-duplicate identical evidence, source spans, and repeated tool results |
| Document reuse | Cache Document Intelligence output by attachment version/hash |
| Policy reuse | Cache retrieval by query/filter/configuration/source version and scope |
| Version comparison | Send structured changed fields, not two complete assessment versions |
| Selective reassessment | Invalidate only affected tasks and narratives |
| Jira control | Never resend full comment history or unrelated issue/project data |
| Retry bounds | Maximum two or three safe retries; one constrained output-repair attempt |
| Conversation control | Recent-turn window plus compact summary and fresh material retrieval |
| Model escalation | Start fast; escalate only for complexity, weak quality, or material synthesis |

## High-token paths

Document interpretation, policy synthesis, committee package drafting, and repeated Q&A are the likely high-token paths. Their budgets are controlled through preprocessing, accepted-fact summaries, top-K retrieval, compact evidence excerpts, caching, and task-specific context. Every run records an estimate even when the provider does not return usage.

## Hackathon route

The demo should use the simplest configured provider route that is available. A fake provider can demonstrate contracts and governance without pretending to measure real model quality. Live Azure/OpenAI metrics must be labeled measured only when returned by the provider.

## Decision

Use fast/structured routing for extraction, gap detection, and routine Q&A; reasoning routing for policy/risk/assessment/committee synthesis; and deterministic code for authority-bearing work. Do not use the strongest model everywhere.
