# ADR-038: Persisted runtime configuration

Status: Accepted. Requirements: REQ-011, REQ-015, REQ-025, REQ-028.

## Decision

Provide an authenticated Configuration section for FCRM Analysts. Settings
are stored in the Neon `fulcrum_configurations` table as validated JSON with a
version and acting user, and changes emit an audit event.

The first configurable sections are:

- risk scoring thresholds and mitigation scale;
- assessment gate and automatic/AI weighting values;
- safe application behavior such as synthetic session/sandbox settings; and
- non-secret Jira/document-processing behavior such as project key, board ID,
  OAuth enablement, and extraction enablement.

API keys, OAuth client secrets, Jira tokens, database credentials, and data
encryption keys remain Vercel environment variables or encrypted server-side
records. They are never exposed as editable configuration fields.

## Consequences

Approved operational settings can change without a redeploy and are
versioned/audited. Configuration writes are denied to non-analyst personas.
The checked-in JSON remains the safe bootstrap/default source, while Neon is
the hosted override source. Future configuration families must add explicit
validation and a requirement/approval boundary; arbitrary JSON editing is not
allowed.

The application controls use a 15-minute default session lifetime. The
synthetic Sandbox feature flag is enforced in the landing page, workbench
navigation, direct page entry, and Sandbox API routes. Disabling it therefore
removes the advertised entry points and denies forced URL/API access.

Evaluation configuration is resolved fresh from Neon whenever a new evaluation
or re-evaluation is calculated. The resulting evaluation JSON includes a
snapshot of the assessment and risk configuration, including registry versions
and capture time. Published Jira evaluation comments therefore retain the
settings used at the time of evaluation, while a later re-evaluation can use
new settings without rewriting prior history.

The configured assessment proceed threshold is applied consistently to the
deterministic, AI, and weighted recommendations for every Jira workflow stage.
Risk boundaries and control mitigation strength remain inputs to the separate
initiative residual-risk calculation; they are not readiness-check inputs for
Jira stages, which do not carry structured risk-factor and control data.
