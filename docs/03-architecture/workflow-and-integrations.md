# Workflow and integration strategy

The workflow engine owns states, transitions, SLA timers, assignments, escalations, and authorization. AI tasks are asynchronous, retryable, idempotent, and cannot advance a human gate. Failed or low-confidence tasks create an escalation and preserve partial artifacts.

Integration priority: identity/RBAC and document/policy sources first; Jira Cloud OAuth 2.0 3LO for engineering traceability; notifications and observability next; Confluence/SharePoint only where business value and approved access exist. Jira design is documented in [jira-oauth-integration.md](jira-oauth-integration.md). Hackathon implementations may use a synthetic demo adapter, but the OAuth path must retain explicit `DEMO ADAPTER` labeling and contract tests. Production adapters must add authorization, rate limits, retries, provenance, data handling, token revocation, reconciliation, and operational ownership.
