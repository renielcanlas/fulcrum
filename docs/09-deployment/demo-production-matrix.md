# Demo versus production deployment matrix

| Capability | Hackathon | Production target |
|---|---|---|
| Runtime | Vercel | Bank-approved cloud |
| Frontend | Next.js on Vercel | Managed web platform |
| Backend | Next.js Node.js Functions | Serverless/container platform |
| Database | In-memory demo currently; managed PostgreSQL next | Enterprise PostgreSQL |
| Secrets | Vercel environment secrets | Enterprise secret manager/KMS |
| CI/CD | GitHub + Vercel | Enterprise pipeline and approvals |
| Identity | Demo persona selector | Enterprise SSO/MFA/IAM |
| Product UI | Landing page, `/demo` FCRM workbench, `/sandbox` Jira experimentation surface | Governed assessment workbench and approved integration/admin surfaces |
| Jira | Server-side OAuth demo connection; fixed-project search and synthetic sandbox scenarios; in-memory connection store | Durable token vault, explicit site/link selection, read reconciliation, freshness, revocation, observability, and approved write-back only |
| Audit | Application records/demo store | Immutable governed archive |
| Logs | Vercel structured logs | Enterprise observability/SIEM |
| Monitoring | Basic telemetry | SRE/SOC/SIEM operations |
| Data | Synthetic | Governed production data |
