# Cross-architecture consistency review

Status: Accepted. Reviewed against the consolidated baseline and ADR index.

## Resolved contradictions

- Jira is consistently an execution/context integration; FULCRUM owns risk decisions.
- AI is consistently advisory; only humans finalize, vote, waive, or decide.
- Risk scoring is consistently deterministic and configuration-versioned; AI explains inputs/results.
- Audit is append-only; corrections use compensating events or versions.
- Assessment versioning prevents destructive mutation and historical loss.
- Browser code receives no OpenAI/Jira/database/session secrets.
- Demo persona authentication is explicitly separate from production enterprise identity.
- Vercel is a web/API deployment choice; domain logic and production mappings remain portable.
- Retrieval indexes are derived; original policy/evidence sources remain authoritative.
- Jira/OpenAI failures degrade their capability and do not corrupt or unnecessarily block valid FULCRUM work.

## Remaining open questions before detailed design

- Which managed PostgreSQL/ORM and migration tool will be selected?
- Which external session/rate-limit store and queue/worker platform will be selected?
- What exact Jira OAuth scopes and callback environments will the implemented features require?
- What committee quorum and voting rule, if any, is required?
- Can `CLOSED` coexist with open conditional-approval obligations, or does closure wait for condition resolution?
- What business-calendar/SLA pause rules apply?
- Under what approved policy may a human final rating differ from the deterministic calculation?
- Which regulatory/policy corpus and retention/classification controls are approved?

## Highest-impact risks and mitigations

- **Missed selective dependencies:** conservative invalidation metadata and Analyst escalation.
- **Ephemeral Vercel state:** external persistence/session/queue before durable deployment.
- **AI hallucination or prompt injection:** bounded tools, source citations, untrusted-content separation, abstention/evaluation tests.
- **Stale Jira context:** explicit links, freshness metadata, webhook-triggered reconciliation.
- **Audit failure during decision:** treat audit persistence as part of consequential command completion.
- **Credential exposure:** server-only adapters, secret provider boundary, redaction, and secret scanning.

## Architecture readiness

**YES — ready for architecture red-team review.** The remaining items are implementation choices or owner policy decisions, not blockers to challenge the architecture. Detailed persistence/schema implementation should wait for the managed database/ORM decision and the committee/condition policy answers.
