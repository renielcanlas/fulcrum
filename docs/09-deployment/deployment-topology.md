# Deployment topology

```text
GitHub repository
       │ push / pull request
       ▼
Vercel CI/CD
       │
       ├── Next.js static/server-rendered frontend
       └── Next.js Node.js Route Handlers / Functions
              │
              ├── FULCRUM domain + RBAC + workflow
              ├── AI Gateway ───────► Azure AI Foundry
              ├── Jira Gateway ◄────── Jira Cloud initiative authority
              ├── Managed PostgreSQL ◄── FULCRUM FCRM data/audit authority
              ├── Object/archive storage ◄── optional governed evidence snapshots
              └── Queue/worker ◄──────── long-running jobs
```

The last four dependencies are target architecture, not current demo dependencies. Browser code can call FULCRUM routes; it cannot call Azure AI, Jira, or other providers with privileged credentials. Jira remains authoritative for business initiative/collaboration data, while Vercel is only the web/API tier and FULCRUM PostgreSQL is authoritative for FCRM assessment/decision state.
