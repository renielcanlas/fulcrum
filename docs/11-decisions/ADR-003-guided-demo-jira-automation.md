# ADR-003: Guided-demo Jira automation credential

Status: Accepted. Requirements: REQ-013, REQ-015. Related: ADR-002.

## Context

The landing guided demo needs to create a comment and upload a supporting PDF without interrupting the walkthrough with a per-user Jira consent screen. The flow uses synthetic Maya Chen data and is not a customer authorization flow.

## Decision

Support an optional server-side Atlassian API-token connection for the guided demo only. It is enabled by `JIRA_GUIDED_DEMO_EMAIL` and `JIRA_GUIDED_DEMO_API_TOKEN`, is selected only for the authenticated synthetic Maya persona and an explicit guided-demo request flag, and is never sent to the browser. The normal per-user OAuth 2.0 path remains the default outside this flow.

The adapter uses Jira Cloud basic authentication with the configured email and API token against the configured Jira site. Audit events identify the connection as `GUIDED_DEMO_AUTOMATION`; they do not claim that the participant individually authorized the action.

## Boundaries

- The credential must belong to a synthetic demo account or an explicitly approved demo principal.
- The token is stored only as a server-side deployment secret and must never be committed or rendered.
- The demo token is limited to the guided comment and attachment operations; it is not a general replacement for user OAuth.
- The account's Jira permissions remain authoritative.
- Production multi-user authorization continues to use OAuth 2.0 3LO.

## Consequences

The guided demo is smoother and deterministic, but Jira will attribute these automated writes to the configured token owner. The token requires rotation and revocation procedures, and the UI must label the action as guided-demo automation when appropriate.
