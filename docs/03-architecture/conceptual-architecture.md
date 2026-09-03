# Conceptual architecture

One modular application with a relational governed data store, object evidence store, search/retrieval index, job queue, deterministic scoring/configuration module, AI gateway, workflow/authorization module, audit ledger, and operator UI/API. Workers run agent tasks through the orchestrator; agents can read scoped context and propose artifacts, but authoritative writes occur through validated application commands.

Flow: intake → workflow case → evidence ingestion → extraction/policy retrieval → structured observations → scoring → analyst review → challenge → committee package → human decision → audit/notifications. The AI gateway hides provider SDKs and records model metadata. Demo adapters are isolated behind interfaces for Jira, repositories, identity, notifications, and observability.

Trust boundaries: user/browser, application API, evidence/parser sandbox, retrieval index, model providers, and external integrations. Authorization is enforced at the application/tool boundary, never delegated to a model. See ADR-000 and [security model](../07-governance/security-model.md).
