# ADR-002: Jira Cloud OAuth 2.0 integration

Status: Accepted. Requirements: REQ-013, REQ-015. Related: ADR-000.

## Context

FULCRUM needs a web experience that can connect a user’s Jira Cloud account for engineering traceability while keeping Jira separate from the governed risk-assessment system. Jira Cloud supports OAuth 2.0 three-legged authorization-code grants for external applications.

## Decision

Implement a server-side Jira adapter using OAuth 2.0 3LO authorization code flow. Bind a one-time `state` to the authenticated FULCRUM session, exchange codes only server-side, encrypt tokens, request read-only scopes first, store cloud/site metadata and provenance, and use the Atlassian API gateway URL keyed by `cloudId`. Treat Jira as an external projection/integration, not a source of risk truth. Writes require a separately approved capability and explicit user confirmation.

## Alternatives

API tokens/basic authentication (poor fit for multi-user web authorization); Forge/Connect (different hosting and app model, not selected for this external workbench); client-side token handling (unacceptable credential exposure); broad scopes (unnecessary blast radius).

## Reasoning

3LO places the user in the consent flow and allows access on the user’s behalf. Server-side custody, narrow scopes, application authorization, and reconciliation preserve least privilege and FULCRUM’s governance boundary. Jira’s own user/project permissions remain a second authorization layer.

## Consequences

The app must operate a credential vault, refresh/revocation lifecycle, scope review, rate-limit handling, sync reconciliation, and integration observability. OAuth security and Atlassian app configuration become release prerequisites. Exact scope choices remain feature-specific and must be reviewed against the Jira endpoint documentation.
