# Jira Cloud OAuth 2.0 integration

## Decision boundary

For a FULCRUM web app integrating with Jira Cloud as an external application, use Atlassian OAuth 2.0 three-legged authorization-code grants (3LO), not API tokens or credentials collected from users. Atlassian documents 3LO for external applications accessing APIs on a user’s behalf and requires `state`, `response_type=code`, a registered `redirect_uri`, and consent in the authorization request. After token exchange, Jira Cloud API calls use the `cloudId` URL form `https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...`. [Atlassian OAuth 2.0 (3LO)](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)

## Logical components

- **Web UI:** starts connection, displays consent/connection status, and requests FULCRUM actions; it never receives Jira tokens.
- **OAuth controller:** creates a cryptographically random, short-lived, single-use `state` bound to the signed-in FULCRUM user/session and handles the callback.
- **Credential vault/repository:** encrypts refresh/access tokens using managed keys; stores token metadata, granted scopes, cloud ID, site URL, owner/tenant, timestamps, and revocation status. Never log token values.
- **Jira adapter:** the only component permitted to call Jira; resolves cloud ID, attaches bearer tokens server-side, refreshes on expiry, enforces scopes and FULCRUM authorization, and normalizes Jira responses.
- **Sync worker:** performs explicit read/write jobs with idempotency, rate-limit/backoff behavior, reconciliation, and audit events.
- **Reference/projection store:** stores only stable Jira correlation IDs, selected metadata, source version/timestamps, retrieval time, and provenance needed by FULCRUM. It is not a copy of the Jira issue model and is not the FCRM decision authority.

## Connection flow

1. Authenticated user selects “Connect Jira”.
2. Server generates state and stores a short-lived connection attempt; redirect to Atlassian authorization with only approved scopes and exact registered callback.
3. Callback validates state, issuer/parameters, signed-in user, and one-time attempt; exchanges the code server-to-server at `https://auth.atlassian.com/oauth/token`.
4. Server discovers accessible Jira containers, presents a site-selection step when needed, and stores the selected `cloudId` and consent metadata. Site/project permissions still constrain calls even when scopes exist; FULCRUM must handle 403 as an authorization result, not broaden scopes automatically. [Atlassian scopes](https://developer.atlassian.com/cloud/jira/platform/scopes-for-oauth-2-3LO-and-forge-apps/)
5. User explicitly chooses what to link or use as assessment context. A sync job reads permitted issues/projects, validates response schemas, stores only the selected reference/metadata or required historical evidence snapshot, and emits audit/provenance. It does not import the complete Jira issue, comment, attachment, or workflow model.

## Scope strategy

Start read-only: `read:jira-work read:jira-user` plus `offline_access` only if background refresh is required. Add `write:jira-work` only for an explicitly approved FULCRUM feature such as adding a Jira comment, and keep that action behind user authorization and an application authorization check. The work-item view uses a separate OAuth 2.0 (3LO) client (`ATLASSIAN_USER_CLIENT_ID` / `ATLASSIAN_USER_CLIENT_SECRET`) for comments; it never uses the service-account client-credentials client on the user’s behalf. Determine endpoint scopes from the exact Jira API operations; do not request broad administrative scopes by default. Atlassian recommends least scope selection and notes that Jira permissions remain an independent constraint. [Atlassian scope guidance](https://developer.atlassian.com/cloud/jira/platform/scopes-for-oauth-2-3LO-and-forge-apps/)

## Failure and lifecycle behavior

Handle consent denial, invalid/expired state, code reuse, token refresh failure, revoked consent, 401/403, rate limiting, transient 5xx, missing cloud ID, deleted projects, schema changes, and partial sync. Retry only safe/idempotent operations; use backoff and a dead-letter/reconciliation queue. Mark a connection degraded or disconnected and notify the user; never silently fall back to another user’s connection. Disconnect revokes/deletes stored credentials according to retention policy and records an audit event.

## FULCRUM/Jira boundary

The Jira integration is a controlled business-initiative and engineering-system adapter. It may retrieve the Jira-backed initiative, link a FULCRUM assessment to Jira issues/attachments/comments, prepare a Jira-ready issue, or (when separately authorized) create/update an issue. It may not infer risk approval from Jira status, accept Jira comments as policy authority without provenance, or change FULCRUM workflow state from an unverified webhook.
