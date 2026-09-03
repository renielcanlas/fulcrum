# Environment model

| Environment | Purpose | Data/credentials | Deployment |
|---|---|---|---|
| Local | Developer feedback | Synthetic data; local `.env` | `npm run dev` |
| Preview | PR/branch review | Synthetic or isolated demo data; preview secrets | Vercel Preview |
| Demo/Production-shaped | Stable judging environment | Synthetic data; dedicated demo Jira/model credentials | Vercel Production |
| Production target | Bank-approved deployment | Governed data and enterprise secrets | Bank platform or approved Vercel architecture |

Environment variables are configured per Vercel environment. Azure AI Foundry endpoint, API version, deployment names, Azure credential mode, Jira secrets, database credentials, and session secrets are server-only; only intentionally public values may use `NEXT_PUBLIC_`. Prefer Azure managed identity and Key Vault in Azure-hosted production; use Vercel server-side encrypted environment variables or an approved secret broker for the Vercel deployment. Changes require a new deployment. Never use real banking data in Local, Preview, or Demo.
