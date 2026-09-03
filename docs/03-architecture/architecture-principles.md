# FULCRUM architecture principles

Status: Accepted baseline. These principles govern implementation decisions and should be challenged through ADRs when a concrete tradeoff arises. See the [consolidated architecture baseline](architecture-baseline.md).

1. **Human accountability is a system invariant.** FULCRUM prepares; authorized humans decide. No AI output, Jira event, or integration callback can approve/reject a risk case.
2. **Domain authority is explicit.** FULCRUM owns risk-case state, assessment versions, scoring configuration, decisions, and audit. Jira owns engineering work. Synchronization never makes Jira authoritative for risk decisions.
3. **Deterministic before probabilistic.** Workflow, authorization, validation, scoring, thresholds, idempotency, and audit are deterministic. AI is limited to language-heavy assistance with structured, cited outputs.
4. **Evidence precedes assertion.** Every material finding links to evidence or a policy reference; uncertainty, missing information, and inference are visible.
5. **Least privilege by default.** Users, agents, jobs, and integrations receive the smallest resource/action scope needed, with authorization checked at the application boundary.
6. **OAuth tokens are credentials, not application data.** Jira access/refresh tokens are encrypted, redacted from logs, scoped narrowly, rotated safely, and never exposed to browsers, models, or client-side code.
7. **External systems are unreliable and untrusted.** Integrations use adapters, timeouts, retries with backoff, rate-limit handling, idempotency keys, circuit breaking, dead-letter/reconciliation paths, and explicit provenance.
8. **Webhooks are hints, not truth.** Jira webhook payloads trigger reconciliation; FULCRUM re-reads the authorized Jira resource before applying a validated projection.
9. **Repository context is portable.** Requirements, schemas, ADRs, prompts, and handoffs are durable repository artifacts shared by AI tools.
10. **Configuration is governed code.** Scoring/workflow parameters are versioned, diffable, approved, effective-dated, and audited; configuration cannot silently alter historical assessments.
11. **Fail closed at governance boundaries.** Ambiguous authorization, stale tokens, missing evidence, invalid artifacts, or inconsistent external state stop or escalate work rather than guessing.
12. **Optimize for a coherent modular system.** Start with a web app and workers behind clear ports; introduce separate services only when isolation, scale, or ownership evidence justifies it.
13. **Observe decisions and costs.** Measure workflow health, integration health, AI quality, human overrides, audit completeness, latency, tokens, and cost.
14. **Design for deletion and revocation.** Disconnecting Jira, revoked consent, retention expiry, and user deprovisioning are first-class lifecycle events with safe cleanup/reconciliation behavior.
