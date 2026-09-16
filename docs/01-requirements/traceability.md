# Traceability structure

The authoritative matrix is maintained as implementation begins. Required columns: requirement ID, user journey, ADR, domain artifact/schema, implementation location, test/evaluation, deployment check, operational metric, owner, status, and evidence link. Current architecture links include REQ-016/017 → ADR-002 → `jira-oauth-integration.md` → OAuth/security/adapter contract tests → deployment secret/configuration checks → connection success, refresh failure, 401/403, sync lag, reconciliation, and revocation metrics. CI should fail for material requirements without a test and metric; exceptions require a documented decision and expiry.

## Current Jira/UI increment

| Requirement | User-facing evidence | Implementation | Tests | Status |
|---|---|---|---|---|
| REQ-016 | Connect Jira from `/sandbox`; server-side OAuth callback and status | `app/api/jira/connect/route.js`, `app/api/jira/callback/route.js`, `app/api/jira/status/route.js`, `src/integrations/jira-oauth.js`, `src/db/persistence.js` | `test/jira-oauth.test.js`, `test/security.test.js` | Demo connection implemented; encrypted durable custody and revocation adapter implemented |
| REQ-017 | Search fixed `FCRM` project and run bounded Jira experiments | `app/api/jira/route.js`, `app/api/jira/execute-step/route.js`, `src/integrations/jira.js`, `data/sandbox/` | `test/jira-sandbox.test.js` | Jira adapter has its own API boundary; governed sync/reconciliation deferred |
| REQ-025 | Synthetic persona entry to `/demo` and `/sandbox` | `app/page.js`, `app/api/session/route.js`, `app/sandbox/page.js` | `test/security.test.js` | Implemented for demo only |
| REQ-026/027 | Session gate, backend-only credentials, audit events for Jira actions | Sandbox route handlers and `src/audit/audit.js` | `test/security.test.js`, `test/jira-sandbox.test.js` | Implemented for current demo boundary |
| REQ-028 | Next.js App Router landing, demo, and sandbox surfaces | `app/page.js`, `app/demo/page.js`, `app/sandbox/page.js` | `npm run build` | Implemented locally; durable deployment state deferred |
| REQ-028/030 | Guided workbench tours for feature orientation and synthetic Golden Initiative creation | `data/config/guided-demos.json`, `app/demo/page.js`, `.github/agents/guided-demo-builder.agent.md` | `test/guided-demos.test.js`, `npm run build` | Implemented; guided writes remain behind existing confirmation and Jira controls |

## Current evaluation increment

| Requirement | User-facing evidence | Implementation | Tests | Status |
|---|---|---|---|---|
| REQ-006/011 | Five Jira workflow stages expose configurable deterministic checks and 25/75 weighted AI scoring | `data/config/stage-evaluations.json`, `data/config/intake-assessment.json`, `src/integrations/stage-evaluation.js`, `src/ai/intake-decision-support.js` | `test/intake-decision-support.test.js` | Implemented for the synthetic Jira-backed prototype |
| REQ-011/015/028 | Persisted, validated runtime configuration for risk, assessment, application, and non-secret integration settings | `app/demo/page.js`, `app/api/configuration/route.js`, `src/configuration/configuration.js`, `db/migrations/003_configurations.sql`, ADR-038 | `npm test`, `npm run build`, configuration API authorization | Implemented; secrets remain Vercel environment variables |
| REQ-018/027 | Stage-specific AI challenge, PDF evidence context, human-readable Jira publication, hidden JSON payload, AI execution telemetry, and audit events | `app/api/jira/assessment/ai/route.js`, `app/api/jira/assessment/route.js`, `src/integrations/document-intelligence.js`, `src/ai/provider.js`, `src/ai/execution-record.js`, `src/observability/ai-telemetry.js`, `src/observability/azure-telemetry.js`, `src/db/persistence.js`, `instrumentation.js` | AI/document/security/telemetry tests and build validation | Implemented; Vercel/Azure span export plus Neon durable AI records; audit write-through persistence implemented |
| REQ-020/022 | Latest evaluation history, stale-result protection, weighted Proceed gate, and explicit next-stage confirmation | `app/demo/page.js`, `app/api/jira/assessment/route.js` | Evaluation helper and lifecycle regression tests | Implemented for current Jira-comment history model |
