# ADR-036: Neon persistence boundary

Status: Accepted. Requirements: REQ-002, REQ-009, REQ-016, REQ-018, REQ-021, REQ-026, REQ-027, REQ-028.

## Decision

Use Neon PostgreSQL as the managed PostgreSQL implementation for FULCRUM-owned durable state in the Vercel deployment. Persist append-only FULCRUM audit events, redacted AI execution records, OAuth state, and encrypted user Jira connection custody. Keep Jira as the source of truth for initiative and collaboration data; store only FULCRUM references, evidence metadata/hashes, and governed snapshots required for replay.

Jira OAuth access and refresh tokens are encrypted with `FULCRUM_DATA_ENCRYPTION_KEY` before database storage. The key remains a server-only Vercel environment variable and is not stored in Neon. If the key is absent, the application must not persist user Jira tokens.

## Consequences

The current synthetic assessment fixture remains a read-only seed while the governed command model is migrated. Durable writes are centralized behind persistence callbacks so the in-memory demo adapters remain available for tests and safe local fallback. Jira issues, comments, attachments, users, and general workflow are not mirrored into PostgreSQL.

## Related decisions

[ADR-017 — Managed PostgreSQL authority](ADR-017-managed-postgresql-authority.md), [ADR-028 — Jira/FULCRUM data authority](ADR-028-jira-fulcrum-data-authority.md), and [physical schema scope](../04-domain/physical-schema-scope.md).
