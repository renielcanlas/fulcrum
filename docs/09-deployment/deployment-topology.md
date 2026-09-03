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
              ├── AI Gateway ───────► OpenAI API
              ├── Jira Gateway ──────► Jira Cloud
              ├── Managed PostgreSQL ◄── authoritative data/audit
              ├── Object storage ◄────── evidence
              └── Queue/worker ◄──────── long-running jobs
```

The last four dependencies are target architecture, not current demo dependencies. Browser code can call FULCRUM routes; it cannot call OpenAI or Jira with privileged credentials. Vercel is the web/API tier, not the FULCRUM system of record.
