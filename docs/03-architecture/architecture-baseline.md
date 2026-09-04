# FULCRUM architecture baseline

Status: Accepted for hackathon implementation. This is the consolidated baseline for detailed design, implementation, testing, evaluation, deployment, and operations. Requirements: REQ-001 through REQ-031.

## Business boundary and authority

Jira is the system of record for the underlying business Initiative and collaboration artifacts. FULCRUM is the authoritative Financial Crime Risk Management assessment system. FULCRUM’s primary governed aggregate is the `Assessment` associated with a Jira-backed Initiative, and it owns accepted assessment facts, evidence lineage, risk factors, inherent/control/residual calculations, controls, analyst assessment, AI recommendations and provenance, overrides, policy references, committee votes, final decisions, conditions, configuration versions, Jira correlation metadata, and audit history.

Jira is an authoritative execution and collaboration platform, not merely a projection. FULCRUM retrieves and displays Jira initiative context through an explicit, auditable adapter. Selected Jira identifiers, freshness metadata, and evidence snapshots/hashes may be stored in FULCRUM when needed for governed traceability. Jira is not the financial-crime decision store and cannot silently change FULCRUM assessment state.

## Governing principle

> Deterministic systems decide what can be decided deterministically. AI prepares evidence and recommendations. Humans make consequential decisions.

Deterministic: authorization, validation, workflow transitions, scoring, control/residual calculations, configuration resolution, SLA calculations, versioning, event/audit generation, and condition status. AI-assisted: extraction, retrieval, summarization, comparison, gap detection, recommendations, and drafting. Human-controlled: accepting/correcting facts, interpreting material risk, overrides, readiness, votes, final dispositions, and waivers.

## Application architecture

The hackathon web tier is a Next.js App Router application deployed to Vercel. The current UI surfaces are the public landing page (`/`), the judge-facing FCRM workbench (`/demo`), and the authenticated Jira experimentation sandbox (`/sandbox`). Server Route Handlers enforce sessions, RBAC, workflow commands, FCRM domain operations, AI gateway calls, Jira gateway calls, persistence, and audit. Domain/workflow modules remain framework- and cloud-portable. Managed PostgreSQL is the accepted persistence target; the current demo uses fixture-backed in-memory adapters for assessment, sessions, Jira connections, and audit until persistence is implemented. Long-running extraction, embeddings, bulk synchronization, and retries evolve to external workers/queues.

## AI architecture

One governed Copilot orchestrator initially invokes typed, permission-checked tools over scoped assessment, policy, evidence, and linked Jira context. The model never receives raw database access, arbitrary SQL/HTTP/filesystem access, secrets, or Jira OAuth tokens. A context builder assembles only task-appropriate data and records a context manifest. Evidence-grounded retrieval treats the original document/policy version as authoritative; indexes and summaries are derived.

Material AI outputs preserve run ID, provider/model, instruction/agent versions, assessment/version, knowledge snapshot, input/retrieved/output references, metrics, and human disposition. Hidden chain-of-thought is not persisted. AI cannot approve, reject, defer, waive, vote, finalize, change scoring rules, or mutate authoritative state.

## Risk and workflow architecture

The explicit state machine is `DRAFT → SUBMITTED → INTAKE_VALIDATION → ASSESSMENT_IN_PROGRESS → ANALYST_REVIEW → DECISION_READY → COMMITTEE_REVIEW → FINAL_DECISION → CLOSED`, with clarification and reassessment branches. `FINAL_DECISION` is a state; its human outcome is `APPROVED`, `APPROVED_WITH_CONDITIONS`, `DEFERRED`, or `REJECTED`. Human gates control intake completeness, analyst review, decision readiness, and committee disposition. Material changes create linked versions and selectively invalidate affected dependency subgraphs.

Scoring is deterministic, configurable, versioned, and explainable. It keeps inherent risk, controls/control effectiveness, residual risk, confidence, evidence quality, and completeness separate. Controls mitigate but do not eliminate risk. Overrides preserve original values and downstream impact; history is append-only.

## Security, identity, and data

The demo uses a clearly labeled synthetic persona selector with server-side opaque sessions. Production evolves to enterprise OIDC/SAML, MFA, IAM provisioning, and deprovisioning. FULCRUM RBAC is separate from Jira OAuth authorization. Azure AI Foundry, Document Intelligence, and Jira credentials are server-only, encrypted/managed, redacted from logs, and never placed in public environment variables. Hackathon data is synthetic only.

## Deployment and delivery

GitHub is source control; Vercel provides Preview and stable Demo/Production-shaped deployments. Environment variables are separated by environment. CI runs tests, build, schema/security checks, and evaluations before promotion. External SaaS failures degrade only their capabilities; database failures reject mutations; audit failure blocks consequential completion where practical. Production mappings remain portable to bank-approved Azure, AWS, or equivalent platforms.

## Non-goals and current gaps

This baseline does not claim production IAM, durable persistence, a live regulatory corpus, durable Jira OAuth token custody, linked-initiative reconciliation, background workers, or a bank-approved deployment. The current Jira OAuth connection and sandbox writes are an explicitly bounded synthetic experiment; they are not live FULCRUM risk-state synchronization. These are staged implementation increments, not hidden assumptions. See [Jira sandbox and experimentation surface](jira-sandbox.md).
