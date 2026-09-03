# FULCRUM implementation and Jira execution plan

Status: **Step 8 — implementation baseline**.

The plan optimizes for a reliable judge-facing vertical slice rather than maximum feature count. Jira remains authoritative for initiative collaboration; FULCRUM owns governed FCRM state.

## Workstreams

| Workstream | Purpose | Dependencies | Priority | Acceptance criteria | Demo relevance |
|---|---|---|---|---|---|
| Foundation/deployment | Next.js/Vercel runtime, environment, health, error boundaries | Existing app | MUST BUILD | Local build and Preview-safe startup | Reliable entry point |
| Assessment lifecycle | Version-aware reads/commands and workflow gates | Data model, workflow | MUST BUILD | Invalid/unauthorized transitions rejected and audited | Product Owner → Analyst → Committee |
| Risk engine | Deterministic scoring/configuration | Assessment facts/controls | MUST BUILD | Reproducible score and trace | Explainability |
| Evidence/document processing | Evidence references and synthetic extraction fixtures | Data model, context contracts | SHOULD BUILD | Source locator and extraction status visible | Grounding story |
| AI harness/RAG | Context Builder, bounded tasks, validation, provenance | Contracts, provider adapter | MUST BUILD | Scoped tools, citations, refusal, telemetry | AI judging criteria |
| Analyst experience | Fact review, override, recommendation, trace | Lifecycle/risk/evidence | MUST BUILD | Daniel can accept/edit/override with rationale | Human governance |
| Committee experience | Finalized package, votes, conditions | Analyst review | MUST BUILD | Helen can decide; AI cannot | Consequential decision boundary |
| Chatbot/Copilot | Read-only initiative-aware Q&A | Context Builder/tools | MUST BUILD | Status/risk/evidence answers and refusal | Demo interaction |
| Audit/traceability | Append-only events and decision trace | All authoritative commands | MUST BUILD | Examiner reconstruction path | Production readiness |
| Evaluation/testing | Contract, governance, scenario, AI metrics | AI harness and fixtures | MUST BUILD | Test suite and honest report | Quality proof |
| Jira integration | OAuth gateway and linked context | Credentials/external setup | SHOULD BUILD | Safe mock contract; live read if configured | Integration credibility |
| Azure services | Foundry and Document Intelligence adapters | Azure resources | ARCHITECTURE ONLY | Provider boundary and config documented | Enterprise portability |
| Durable PostgreSQL | Physical schema, migrations, seed | ORM/schema decision | SHOULD BUILD | Foreign keys and resettable seed | Production credibility |
| Advanced retrieval/queues | Embeddings, workers, durable orchestration | Persistence and corpus | DEFER | Documented production evolution | Not worth demo risk |

## Critical dependency order

```text
contracts/validation
→ context builder and bounded tools
→ deterministic lifecycle/risk/evidence services
→ analyst/committee commands
→ grounded Copilot tasks
→ audit/trace
→ evaluation and deployment hardening
```

## Jira execution

If Jira credentials are available, create/link only synthetic issues and use the existing OAuth/gateway contract. If unavailable, use the canonical fixture and clearly label the adapter `DEMO ADAPTER`. Do not maintain a second manually copied planning system; this document is the execution source until Jira synchronization is implemented.

## Definition of done for the judge path

Product Owner opens the synthetic initiative, Analyst sees evidence and deterministic risk, AI explains/drafts with bounded context, Analyst records an override, Committee reviews a generated package, the final decision remains human, and the trace reconstructs source → fact → risk → control → score → AI → human → decision → audit.
