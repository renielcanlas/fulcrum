# Jira sandbox and experimentation surface

Status: implemented hackathon increment. This page documents the experimental Jira surface currently available in the application; it is not a production synchronization design.

## Purpose

The Jira sandbox gives the team a safe, visible place to validate the Atlassian connection and experiment with synthetic work items before building the governed FULCRUM/Jira synchronization path. It is intentionally separate from the FULCRUM assessment workflow and decision authority.

Open it at `/sandbox` after starting a local or deployed application and selecting a synthetic demo persona. The landing page remains the public product introduction; `/demo` is the judge-facing FCRM workbench; `/sandbox` is the engineering and integration experiment surface.

## Current capabilities

The sandbox is scoped to the configured `FCRM` Jira project (`data/config/jira-integration.json`). It currently provides:

- Jira search with an optional JQL clause. The backend always adds `project = FCRM` and returns normalized issue fields such as key, summary, status, assignee, due date, type, updated time, and Jira URL.
- Atlassian OAuth 2.0 3LO connection and reconnect flow through `/api/jira/connect` and `/api/jira/callback`, with connection status available from `/api/jira/status`.
- Scenario inspection from JSON files under `data/sandbox/`, including the execution plan and raw JSON.
- Step-by-step scenario execution with explicit confirmation and visible progress.
- Synthetic Jira work-item operations: create, update, transition, assign, comment, and delete all work items matched in the fixed `FCRM` project.
- Custom JSON scenarios for experimentation, validated in the browser and constrained by the server-side action allowlist and fixed project boundary.

The checked-in scenarios demonstrate creating an initiative, provisioning a synthetic FCRM board, and cleaning up FCRM test work items. Scenario files are data, not executable JavaScript; unsupported actions fail at the server boundary.

## Request and authorization boundary

```text
Synthetic persona session
          |
          v
Next.js sandbox route handlers
  session check + fixed FCRM project
          |
          v
Jira adapter
  Atlassian OAuth bearer token
          |
          v
Atlassian Jira Cloud REST API
```

The browser does not receive Jira client secrets, access tokens, or refresh tokens. The application requires a valid FULCRUM demo session before connection, search, or mutation routes can be used. Jira authorization remains separate from FULCRUM role authorization; Jira can still deny an operation with 401/403 based on the connected account, project permission, or granted scope.

Each sandbox search and scenario step records an audit event with the synthetic actor, project or issue identifier, action, and result metadata. Credentials are not included in audit records.

## Safety and data rules

All sandbox content must be synthetic. Do not use customer, account, partner, production issue, or real regulatory data. The sandbox is a test-account surface, not a place to exercise production Jira credentials.

The `cleanup-fcrm` scenario is destructive: it searches the entire configured `FCRM` project and permanently deletes every returned work item. Use it only against the dedicated synthetic test project/account, after confirming the project and connection. The application does not treat cleanup as a FULCRUM decision or workflow operation.

## Current limitations

- OAuth connections, sessions, and audit records use the current in-memory stores; they are not durable across process restarts or reliable as-is on multi-instance serverless deployment.
- The callback currently selects the first accessible Jira site, unless `JIRA_CLOUD_ID` is configured; a production UX should present an explicit site-selection step.
- The sandbox has no durable sync, webhook reconciliation, token vault, background refresh worker, rate-limit queue, or production observability.
- Scenario execution is sequential and stops on the first failed step. It is not a general workflow engine and does not advance FULCRUM assessment state.
- The current OAuth scope request includes read and write Jira scopes because the sandbox demonstrates controlled write experiments. Production scope review must minimize permissions and separate read-only integration from any approved write-back feature.

## Traceability

The increment provides executable evidence for the connection and adapter direction in `REQ-016`, `REQ-017`, `REQ-025`, `REQ-026`, and `REQ-027`. Contract coverage is in `test/jira-oauth.test.js`, `test/jira-sandbox.test.js`, and `test/security.test.js`. Production completion still requires the acceptance evidence defined in [requirements](../01-requirements/requirements.md), including durable token custody, revocation, reconciliation, and negative security tests.

Related: [Jira OAuth integration](jira-oauth-integration.md), [Jira/FULCRUM data authority](../11-decisions/ADR-028-jira-fulcrum-data-authority.md), [demo versus production matrix](../09-deployment/demo-production-matrix.md), and [sandbox scenario data](../../data/sandbox/).
