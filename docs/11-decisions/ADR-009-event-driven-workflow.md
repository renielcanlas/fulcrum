# ADR-009: Event-driven workflow integration

Status: Accepted. Requirements: REQ-009, REQ-013, REQ-017.

## Context

Audit, notifications, AI, Jira synchronization, analytics, and observability should react to workflow changes without coupling every module.

## Decision

Accepted commands emit versioned domain events. Consumers are asynchronous, idempotent, observable, and unable to bypass the state machine. The initial deployment may use an in-process/outbox implementation before a broker is justified.

## Consequences

The system gains loose coupling and replay potential but must handle ordering, retries, duplicates, dead letters, and eventual consistency.
