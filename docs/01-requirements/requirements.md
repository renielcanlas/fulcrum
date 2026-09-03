# Requirements and traceability

Status: bootstrap baseline. Product and control owners must validate before implementation.

| ID | Requirement | Acceptance evidence | Owner |
|---|---|---|---|
| REQ-001 | Capture and track a change request through governed lifecycle states. | State-transition and authorization tests; audit events. | Product/FCRM |
| REQ-002 | Maintain structured initiative, risk, control, evidence, policy, finding, decision, and review records. | Data model/schema tests. | Architecture |
| REQ-003 | Extract facts and gaps from submitted documents with source spans and uncertainty. | Golden extraction evaluation. | AI/FCRM |
| REQ-004 | Retrieve applicable policy/framework material with citations and source/interpretation separation. | Retrieval and citation evaluation. | FCRM/Legal |
| REQ-005 | Produce structured risk observations and a draft assessment; never make the final decision. | Agent contract tests and human gate. | FCRM |
| REQ-006 | Calculate ratings deterministically from configurable, versioned parameters. | Calculation/property tests; parameter audit. | FCRM/Engineering |
| REQ-007 | Preserve analyst review, challenge, overrides, rationale, and downstream impact. | Override/audit tests. | FCRM |
| REQ-008 | Support committee approve, reject, defer, and approve-with-conditions actions with authorization. | Workflow/negative authorization tests. | Committee |
| REQ-009 | Reconstruct a case months later, including AI provenance and retrieved context. | Audit replay test. | Risk/Engineering |
| REQ-010 | Provide grounded conversational Q&A over governed case context. | Grounding, refusal, and citation tests. | Product |
| REQ-011 | Allow authorized configuration of scoring, thresholds, and workflow without code deployment. | Configuration versioning and approval tests. | FCRM |
| REQ-012 | Provide synthetic golden datasets, AI evaluations, regression tests, and quality feedback loops. | Evaluation reports in `.ai/evaluations/`. | QA/AI |
| REQ-013 | Connect requirements through design, implementation, tests, deployment, and operational metrics. | Traceability matrix and CI checks. | Engineering |
| REQ-014 | Support interchangeable AI providers through adapters and record provider/model/version. | Provider contract tests. | AI Platform |
| REQ-015 | Enforce RBAC, least privilege, prompt/document threat controls, and secrets protection. | Threat-model review and security tests. | Security |
| REQ-016 | Connect the web app to Jira Cloud through server-side OAuth 2.0 3LO with scoped consent and encrypted token handling. | OAuth flow, token custody, scope, revocation, and negative security tests. | Platform/Security |
| REQ-017 | Synchronize Jira data through an isolated, observable adapter without making Jira authoritative for FULCRUM risk state. | Adapter contract, reconciliation, provenance, and boundary tests. | Platform/FCRM |
| REQ-018 | Provide an FCRM copilot that drafts, explains, challenges, and identifies gaps while preserving human decision authority. | Agent contract, grounding, review, override, and prohibited-action tests. | FCRM/AI |
| REQ-019 | Provide chatbot Q&A using permission-checked, explicitly linked, reconciled Jira initiative context plus FULCRUM context. | Context-manifest, access-isolation, citation, freshness, refusal, and regression tests. | Product/Platform |
| REQ-020 | Enforce the canonical assessment lifecycle through a centralized explicit state machine. | Transition-table, authorization, precondition, idempotency, and negative tests. | Platform/FCRM |
| REQ-021 | Preserve immutable workflow, AI, override, vote, decision, and condition history. | Audit replay and tamper/compensating-event tests. | Governance/Platform |
| REQ-022 | Create linked assessment versions for material changes with dependency-aware selective reassessment. | Version, invalidation, comparison, and impact tests. | FCRM/Platform |
| REQ-023 | Emit versioned domain events for accepted material workflow transitions. | Event catalogue, outbox/retry, ordering, and idempotency tests. | Platform |
| REQ-024 | Govern conditional approvals with owners, due dates, evidence, verification, waiver, and overdue states. | Condition lifecycle and authorization tests. | FCRM/Committee |
| REQ-025 | Provide a demo-only persona selector with server-side sessions and explicit production identity boundaries. | Persona catalog, session, logout, and unauthorized API tests. | Platform/Security |
| REQ-026 | Enforce application-owned RBAC separately from Jira OAuth authorization. | Role/capability matrix and cross-role negative tests. | Security |
| REQ-027 | Protect provider/Jira credentials and preserve AI/security/business audit provenance without raw secrets. | Secret scanning, redaction, audit schema, and failure-path tests. | Platform/Security |
| REQ-028 | Deploy the web tier through a framework and hosting model that supports server-side integrations, streaming, durable external state, and Preview/Production separation. | Next.js build, Vercel Preview smoke test, environment/configuration checks, and persistence tests. | Platform/Delivery |
| REQ-029 | Model Initiative as the primary FULCRUM domain object for business change, assessment, evidence, controls, decisions, conditions, and history. | Domain schema, API/tool, migration-alias, and traceability tests. | Product/Architecture |
| REQ-030 | Maintain a canonical synthetic golden initiative that exercises the full lifecycle, risk traceability, AI artifacts, analyst override, committee decision, conditions, and linked Jira work. | Fixture validation, explainability-reference tests, workflow replay, and judge-facing demo documentation. | Product/FCRM/QA |
| REQ-031 | Provide an AI Gateway with Azure AI Foundry as the primary configurable platform route and Azure AI Document Intelligence as a separate provenance-preserving document extraction capability. | Adapter contract tests, routing/configuration tests, extraction provenance tests, access/security tests, and evaluation results. | AI Platform/FCRM/Security |

## Traceability convention

Use `REQ-NNN` in ADRs, Jira-ready work items, schemas, test names, deployment checks, and metrics. The implementation matrix will be maintained at `docs/01-requirements/traceability.md`; each row links requirement → decision → artifact/code → test → deployment check → metric. Missing links are release blockers for material behavior.

## Assumptions and open questions

See [assumptions-open-questions.md](../00-context/assumptions-open-questions.md). These are not requirements until owners accept them.
