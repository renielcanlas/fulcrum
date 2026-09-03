# Workflow and integration strategy

The workflow engine owns states, transitions, SLA timers, assignments, escalations, and authorization. AI tasks are asynchronous, retryable, idempotent, and cannot advance a human gate. Failed or low-confidence tasks create an escalation and preserve partial artifacts.

Integration priority: identity/RBAC and document/policy sources first; notifications and observability next; Jira/Confluence/SharePoint only where business value and approved access exist. Hackathon implementations use synthetic demo adapters with explicit `DEMO ADAPTER` labels and contract tests. Production adapters must add authorization, rate limits, retries, provenance, data handling, and operational ownership.
