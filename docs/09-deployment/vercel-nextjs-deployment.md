# Vercel deployment architecture

## Recommendation

Adopt Next.js App Router as the web framework and deploy the web application/API to Vercel. Keep domain logic, workflow state machine, AI provider, Jira adapter, authorization, and audit interfaces framework-neutral so they can move to a worker/service later if needed.

The current hand-rolled Node server is useful for local demonstration, but it assumes a long-lived process and in-memory state. Vercel Functions are request-oriented and can run on different instances; sessions, audit, conversations, assessment data, OAuth tokens, and jobs must not rely on process memory. Vercel’s guidance also recommends external state such as Redis for shared state. [Vercel Functions limits](https://vercel.com/docs/functions/limitations) [Vercel Fluid Compute](https://vercel.com/kb/guide/vercel-services-fluid-compute)

## Target shape

```text
Next.js UI (Assessment / Committee / Copilot)
             │
     Route Handlers / Server Actions
             │
     auth · RBAC · domain services
       ┌─────┼─────────┬──────────┐
       │     │         │          │
   Postgres Redis   AI Gateway  Jira Gateway
       │     │         │          │
   risk truth  sessions/jobs  OpenAI   Atlassian
```

Recommended external dependencies: managed Postgres for FULCRUM authority and audit, Redis or equivalent for ephemeral session/rate-limit/job coordination, object storage for evidence, and a durable queue/workflow service for long-running extraction/sync tasks. The exact vendors are OPEN QUESTIONS.

## Runtime boundaries

- **Next.js Server Components:** render authorized data; never expose secrets.
- **Route Handlers:** authenticate requests, authorize capabilities, validate inputs, call domain services, and stream Copilot responses where appropriate.
- **AI/Jira adapters:** server-only modules; API keys and OAuth tokens never enter client bundles.
- **Background workers:** process documents, Jira sync, and retries asynchronously; do not depend on a Vercel function remaining alive.
- **Database/outbox:** persist authoritative state and publish reliable domain events.

## Environment configuration

Configure `OPENAI_API_KEY`, `OPENAI_MODEL`, database URL, session secret, Jira OAuth client ID/secret, and callback URLs in Vercel project environment variables for Development, Preview, and Production as appropriate. Vercel encrypts environment variables at rest; changes apply to new deployments, so rotate/redeploy deliberately. [Vercel environment variables](https://vercel.com/docs/environment-variables)

Only variables intentionally safe for the browser use the `NEXT_PUBLIC_` prefix. Never use that prefix for OpenAI, Jira, database, or session secrets.

## Deployment process

1. Create the Next.js application and preserve existing domain modules/tests. **Current status:** the repository now has the Next.js App Router shell and route-handler equivalents for health, sessions, demo users, and Copilot responses.
2. Move the UI into `app/` routes and the Copilot endpoint into a server Route Handler.
3. Replace in-memory sessions, audit, repository, and conversations with external persistence interfaces; use a demo database adapter locally.
4. Add health/readiness endpoints that do not reveal secrets and identify provider/database configuration state.
5. Add Vercel environment variables separately for Preview and Production.
6. Configure Jira OAuth callback URLs for the Vercel Preview/Production domains; never use a wildcard callback in production.
7. Deploy a Preview from a branch and run unit, integration, authorization, security, and smoke tests.
8. Verify streaming, tool calls, audit persistence, session behavior across repeated requests, and Jira failure/reconciliation behavior.
9. Promote to Production only after secrets, data handling, security, and human-governance checks pass.
10. Monitor function errors/duration, AI latency/tokens/cost, database health, queue lag, Jira sync health, authorization failures, and audit completeness.

## Function design constraints

Keep interactive Copilot requests bounded and stream responses. Move OCR, document extraction, bulk Jira synchronization, embeddings, and retries to durable background jobs. Do not depend on local filesystem persistence or global in-memory state. Vercel documents plan-dependent function duration and memory limits; configure `maxDuration` only after measuring the actual workload. [Vercel function limits](https://vercel.com/docs/functions/limitations)

## Rollback

Use Vercel deployment promotion/rollback for application code, retain database migrations as forward-compatible, and version prompts/models/configuration. Never roll back by deleting audit events or rewriting assessment decisions.
