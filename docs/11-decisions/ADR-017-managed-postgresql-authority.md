# ADR-017: Managed PostgreSQL as authoritative persistence

Status: Accepted. Requirements: REQ-002, REQ-009, REQ-021, REQ-028.

## Decision

Use Supabase PostgreSQL or equivalent managed PostgreSQL for FULCRUM business data, assessment versions, configuration, audit, and correlation data. The current demo remains in-memory until this increment is implemented.

## Consequences

The database needs migrations, pooling, backups, access controls, and an outbox/event strategy. PostgreSQL is authoritative for FULCRUM assessment, risk, decision, condition, configuration, and audit state. Jira remains authoritative for initiative/collaboration content; PostgreSQL stores only FULCRUM references, selected metadata, and evidence snapshots/hashes required for governance or replay.
