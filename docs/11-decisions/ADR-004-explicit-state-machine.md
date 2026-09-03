# ADR-004: Explicit state-machine workflow

Status: Accepted. Requirements: REQ-001, REQ-008, REQ-013.

## Context

Workflow eligibility, governance gates, and human decisions must be consistent and auditable.

## Decision

Centralize lifecycle states, transitions, actor permissions, preconditions, required justification, emitted events, and timestamps in an explicit state-machine module. UI, AI, Jira, and other consumers submit commands rather than changing state directly.

## Alternatives

Scattered conditionals or workflow inferred from Jira status. Both create inconsistent authorization, difficult replay, and weak auditability.

## Consequences

Transitions are testable and reviewable; adding states requires deliberate schema/ADR review. Consumers must handle rejected commands and asynchronous events.
