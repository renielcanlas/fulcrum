# ADR-018: Server-side third-party integration gateways

Status: Accepted. Requirements: REQ-016, REQ-017, REQ-027.

## Decision

All Jira and OpenAI calls flow through server-only FULCRUM gateways. Credentials are resolved server-side and tool/domain authorization occurs before outbound calls.

## Consequences

Browser code is simpler and safer, while adapters must handle timeout, retry, rate limits, correlation, redaction, and failure isolation.
