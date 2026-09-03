# Environment model

| Environment | Purpose | Data/credentials | Deployment |
|---|---|---|---|
| Local | Developer feedback | Synthetic data; local `.env` | `npm run dev` |
| Preview | PR/branch review | Synthetic or isolated demo data; preview secrets | Vercel Preview |
| Demo/Production-shaped | Stable judging environment | Synthetic data; dedicated demo Jira/model credentials | Vercel Production |
| Production target | Bank-approved deployment | Governed data and enterprise secrets | Bank platform or approved Vercel architecture |

Environment variables are configured per Vercel environment. `OPENAI_API_KEY`, Jira secrets, database credentials, and session secrets are server-only; only intentionally public values may use `NEXT_PUBLIC_`. Changes require a new deployment. Never use real banking data in Local, Preview, or Demo.
