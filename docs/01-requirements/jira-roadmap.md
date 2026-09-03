# Jira-ready implementation roadmap

No Jira issue creation is authorized by this bootstrap. The following is a planning backlog; each item should become an Epic/Story/Task only after owner review.

| Epic | Stories / tasks | Refs |
|---|---|---|
| Governed intake | case schema, lifecycle, RBAC, clarification UI | REQ-001, 002, 015 |
| Evidence and research | upload sandbox, extraction artifact, policy index/citations | REQ-003, 004 |
| Azure document pipeline | AI Gateway, Azure AI Foundry adapter, model routing, Document Intelligence extraction, normalized evidence, embeddings/indexing | REQ-003, 004, 012, 014 |
| Risk workbench | factor taxonomy, controls, deterministic scoring/config versioning | REQ-006, 011 |
| Analyst and committee | review, override, challenge, briefing, decision gates | REQ-005, 007, 008 |
| Audit and assistant | append-only export, grounded Q&A, history | REQ-009, 010 |
| AI SDLC and quality | provider adapters, schemas, golden set, regression/evaluation gates | REQ-012–014 |
| Delivery and operations | CI/CD, observability, runbooks, demo adapters | REQ-013, 015 |
| Jira integration | OAuth connection UX, encrypted credential metadata, scoped read sync, reconciliation, disconnect/revocation | REQ-016, 017 |
| FCRM Copilot | linked Jira context assembler, analyst copilot, grounded Q&A, challenge/draft actions, evaluation gates | REQ-018, 019 |

Acceptance criteria must name evidence, authorization, failure behavior, and human outcome. Jira remains engineering tracking; FULCRUM remains the risk system.
