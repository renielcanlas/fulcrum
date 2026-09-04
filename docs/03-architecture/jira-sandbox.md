# Jira sandbox and experimentation surface

Status: implemented hackathon increment. This page documents the experimental Jira surface currently available in the application; it is not a production synchronization design.

## Purpose

The Jira sandbox gives the team a safe, visible place to validate the Atlassian connection and experiment with synthetic work items before building the governed FULCRUM/Jira synchronization path. It is intentionally separate from the FULCRUM assessment workflow and decision authority.

Open it at `/sandbox` directly after starting a local or deployed application. The landing page remains the public product introduction; `/demo` is the judge-facing FCRM workbench; `/sandbox` is the engineering and integration experiment surface.

## Current capabilities

The sandbox is scoped to the configured `FCRM` Jira project (`data/config/jira-integration.json`). It currently provides:

- Jira search with an optional JQL clause. The backend always adds `project = FCRM` and returns normalized issue fields such as key, summary, status, assignee, due date, type, updated time, and Jira URL.
- Atlassian service-account OAuth 2.0 connection using client credentials, with a server-side cached access token and connection status available from `/api/jira/status`.
- Scenario inspection from JSON files under `data/sandbox/`, including the execution plan and raw JSON.
- Step-by-step scenario execution with explicit confirmation and visible progress.
- Synthetic Jira work-item operations: create, update, transition, assign, comment, and delete all work items matched in the fixed `FCRM` project.
- Custom JSON scenarios for experimentation, validated in the browser and constrained by the server-side action allowlist and fixed project boundary.
- AI scenario builder: describe a synthetic experiment, receive an initial JSON draft immediately, then allow deterministic validation and a bounded Azure AI refinement pass to improve it before execution.
- Persona-code assignment: scenarios use readable codes such as `analyst-7` or `committee-1`; the server resolves those codes to verified Atlassian account IDs immediately before Jira assignment.
- Preflight preview: the sandbox validates the complete scenario before Jira mutation and shows step-level status, warnings, and errors in the confirmation dialog.
- Intake evaluation: an Intake-stage work item can be evaluated against the checked-in weighted configuration in [`data/config/intake-assessment.json`](../../data/config/intake-assessment.json). The result is reviewable in the work-item view and, after explicit confirmation, published as a structured Jira comment by the FULCRUM service account.

The checked-in scenarios demonstrate creating an initiative, provisioning a synthetic FCRM board, and cleaning up FCRM test work items. Scenario files are data, not executable JavaScript; unsupported actions fail at the server boundary. Cleanup remains available as an explicit scenario, but the AI builder does not generate destructive cleanup steps automatically.

## Intake evaluation increment

Intake is the first stage-gated FULCRUM evaluation. The work-item page offers **Evaluate Intake** only while the Jira status is `Intake` and no FULCRUM Intake evaluation marker is present. The deterministic evaluator checks project, summary, description, issue type, owner, classification labels, and initial collaboration context. Each check has a configurable weight and produces a pass, partial, or fail result. A score of 80 or more recommends `Proceed`; otherwise the recommendation is `Hold for remediation`.

The assessment remains in Jira for this increment. Publishing adds a human-readable comment plus a machine-readable marker and JSON payload. After publication, a `Proceed` recommendation asks the user whether to transition the item to `Context and Research`. The transition is explicit, uses the service account, and is followed by a fresh Jira read so the page reflects the new status. No database persistence is required yet.

## AI scenario builder

The **Custom scenario** option splits the editor into two panels. The AI assistant accepts a plain-language request, while the JSON editor remains the reviewable source of truth. A request with existing JSON asks Azure AI to revise that JSON; an empty editor asks for a new scenario.

The builder uses a bounded two-stage flow:

1. Azure AI returns an initial draft, which is placed in the JSON editor immediately so the user can see the output.
2. FULCRUM validates the draft against the sandbox contract and displays step indicators. Valid steps are green, the first invalid step is red, and later steps remain gray.
3. The draft is sent back to Azure AI with the validation errors for refinement. The server allows up to three repair attempts and never sends an unvalidated AI response to Jira.
4. The refined JSON replaces the draft only when it passes deterministic validation. If refinement fails, the initial draft remains visible for correction or download.

The builder supplies Azure with the six synthetic persona codes and the supported FCRM action/field contract. It must not invent Jira custom fields, raw Atlassian account IDs, localized field names, arbitrary URLs, credentials, or unsupported actions. Persona codes are resolved server-side; names alone are not Jira assignees.

See the [Jira sandbox user guide](jira-sandbox-user-guide.md) for the screen-by-screen workflow, JSON examples, validation indicators, failure handling, and cleanup procedure.

## Request and authorization boundary

```text
Public sandbox page
          |
          v
Next.js sandbox route handlers
  fixed FCRM project
          |
          v
Jira adapter
  Atlassian service-account OAuth bearer token
          |
          v
Atlassian Jira Cloud REST API
```

The browser does not receive Jira client secrets, access tokens, or refresh tokens. The sandbox has no FULCRUM persona login gate; Jira authentication is performed only by the server-side service-account credential. Jira can still deny an operation with 401/403 based on the service account's product access, project permission, or granted scope.

Each sandbox search and scenario step records an audit event with the synthetic actor, project or issue identifier, action, and result metadata. Credentials are not included in audit records.

## Safety and data rules

All sandbox content must be synthetic. Do not use customer, account, partner, production issue, or real regulatory data. The sandbox is a test-account surface, not a place to exercise production Jira credentials.

The `cleanup-fcrm` scenario is destructive: it searches the entire configured `FCRM` project and permanently deletes every returned work item. Use it only against the dedicated synthetic test project/account, after confirming the project and connection. The application does not treat cleanup as a FULCRUM decision or workflow operation.

## Current limitations

- Service-account access tokens are cached in memory and reacquired when they expire; audit records use an in-memory store, so the current implementation is not reliable as-is on multi-instance serverless deployment.
- The service-account flow uses the configured `JIRA_CLOUD_ID` and `JIRA_SITE_URL`; it does not perform interactive site selection.
- The sandbox has no durable sync, webhook reconciliation, token vault, background refresh worker, rate-limit queue, or production observability.
- Scenario execution is sequential and stops on the first failed step. It is not a general workflow engine and does not advance FULCRUM assessment state.
- Scenario transition labels use the checked-in English workflow names, with aliases for the configured Jira workflow's localized `审查` (Review) and `决策` (Decision) statuses. Other workflow-specific labels must be added deliberately.
- The service-account credential must be granted only the Jira scopes and project permissions required by the sandbox. Production scope review must minimize permissions and separate read-only integration from any approved write-back feature.

## Traceability

The increment provides executable evidence for the connection and adapter direction in `REQ-016`, `REQ-017`, `REQ-026`, and `REQ-027`. Contract coverage is in `test/jira-oauth.test.js`, `test/jira-sandbox.test.js`, and `test/security.test.js`. Production completion still requires the acceptance evidence defined in [requirements](../01-requirements/requirements.md), including durable token custody, revocation, reconciliation, and negative security tests.

Related: [Jira OAuth integration](jira-oauth-integration.md), [Jira/FULCRUM data authority](../11-decisions/ADR-028-jira-fulcrum-data-authority.md), [demo versus production matrix](../09-deployment/demo-production-matrix.md), and [sandbox scenario data](../../data/sandbox/).
