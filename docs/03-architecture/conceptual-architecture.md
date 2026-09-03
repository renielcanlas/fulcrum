# Conceptual architecture

One web application with a relational FULCRUM governed data store, Jira-backed initiative context, optional evidence archive, search/retrieval index, job queue, deterministic scoring/configuration module, AI gateway, workflow/authorization module, audit ledger, and operator UI/API. Workers run agent tasks and integration sync jobs through the orchestrator; agents and external adapters can read scoped context and propose changes, but authoritative FCRM writes occur through validated application commands. Architecture principles are defined in [architecture-principles.md](architecture-principles.md).

Flow: Jira initiative/context → FULCRUM assessment intake → Jira attachment evidence reference and extraction → policy retrieval → structured observations → scoring → analyst review → challenge → committee package → human FCRM decision → audit/notifications. Jira remains authoritative for business initiative/collaboration data; FULCRUM remains authoritative for assessment and decision lineage. The AI gateway hides provider SDKs and records model metadata. Adapters are isolated behind interfaces for Jira, repositories, identity, notifications, and observability.

Authority/data flow:

```text
                         JIRA
          Business Initiative / Collaboration
      ┌────────────────────────────────────────┐
      │ title · description · assignee          │
      │ attachments · comments · due dates     │
      │ tasks · related issues · Jira history  │
      └───────────────────┬────────────────────┘
                          │ Jira API / OAuth
                          ▼
                    FULCRUM APP
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
      Jira-backed context       FULCRUM database
      IDs · freshness ·         governed FCRM state
      evidence locators         ──────────────────
      hashes/snapshots          assessments/versions
                                accepted facts
                                risk/scoring/controls
                                AI provenance
                                overrides/decisions
                                conditions/audit
```

Trust boundaries: user/browser, application API, evidence/parser sandbox, retrieval index, model providers, and external integrations. Authorization is enforced at the application/tool boundary, never delegated to a model. See ADR-000 and [security model](../07-governance/security-model.md).
