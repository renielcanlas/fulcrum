# Traceability structure

The authoritative matrix is maintained as implementation begins. Required columns: requirement ID, user journey, ADR, domain artifact/schema, implementation location, test/evaluation, deployment check, operational metric, owner, status, and evidence link. Current architecture links include REQ-016/017 → ADR-002 → `jira-oauth-integration.md` → OAuth/security/adapter contract tests → deployment secret/configuration checks → connection success, refresh failure, 401/403, sync lag, reconciliation, and revocation metrics. CI should fail for material requirements without a test and metric; exceptions require a documented decision and expiry.

## Current Jira/UI increment

| Requirement | User-facing evidence | Implementation | Tests | Status |
|---|---|---|---|---|
| REQ-016 | Connect Jira from `/sandbox`; server-side OAuth callback and status | `app/api/jira/connect/route.js`, `app/api/jira/callback/route.js`, `app/api/jira/status/route.js`, `src/integrations/jira-oauth.js` | `test/jira-oauth.test.js`, `test/security.test.js` | Demo connection implemented; durable custody/revocation deferred |
| REQ-017 | Search fixed `FCRM` project and run bounded Jira experiments | `app/api/sandbox/jira/route.js`, `app/api/sandbox/jira/execute-step/route.js`, `src/integrations/jira.js`, `data/sandbox/` | `test/jira-sandbox.test.js` | Sandbox adapter implemented; governed sync/reconciliation deferred |
| REQ-025 | Synthetic persona entry to `/demo` and `/sandbox` | `app/page.js`, `app/api/session/route.js`, `app/sandbox/page.js` | `test/security.test.js` | Implemented for demo only |
| REQ-026/027 | Session gate, backend-only credentials, audit events for Jira actions | Sandbox route handlers and `src/audit/audit.js` | `test/security.test.js`, `test/jira-sandbox.test.js` | Implemented for current demo boundary |
| REQ-028 | Next.js App Router landing, demo, and sandbox surfaces | `app/page.js`, `app/demo/page.js`, `app/sandbox/page.js` | `npm run build` | Implemented locally; durable deployment state deferred |
