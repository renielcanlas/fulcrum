# Personas and journeys

## Personas

Product Owner submits a change, evidence, and clarifications; tracks status and sees the final decision. FCRM Analyst investigates, validates AI findings, assesses risk, overrides suggestions with rationale, and recommends an outcome. Risk Committee challenges the decision-ready package and makes the authorized approve/reject/defer/conditional decision.

## Jira test-account access

The hackathon Jira board uses a separate test account. These credentials are for the authorized demonstration environment only; they are not FULCRUM production identities. All personas use the password `Genius123!`.

| Persona | Jira test-account email |
| --- | --- |
| Maya Chen | `menebi8777@dd2car.com` |
| Marcus Thompson | `sheelaghyirs@instantbox.live` |
| Daniel Reyes | `danielreye@instantbox.live` |
| Priya Shah | `priyashah@instantbox.live` |
| Helen Morgan | `helenmorga@instantbox.live` |
| Robert Kim | `RobertKim@instantbox.live` |

## Primary journey

Product Owner submits → deterministic validation and intake agent identify gaps → owner answers clarifications → document intelligence extracts facts → policy research retrieves cited material → analyst confirms evidence and risk observations → deterministic engine computes inherent/control/residual views → analyst reviews and may override → challenge agent flags contradictions → analyst resolves or documents open items → briefing agent drafts package → committee inspects evidence and decides → immutable audit and notifications → feedback enters evaluation dataset.

## Human checkpoints

Intake completeness controls missing/ambiguous inputs; analyst validation controls extraction and interpretation error; parameter publication controls unauthorized rule change; assessment sign-off controls material judgment; committee decision controls institutional accountability. At each disagreement, preserve the AI output, human action, reason/category, identity/time, and downstream impact; workflow proceeds according to the human-authorized state transition or escalates.

## Sandbox operator journey

The sandbox is used by the builder or demo operator as an integration test surface, not as a FULCRUM decision workspace:

1. Enter through the landing page and select a synthetic persona.
2. Open `/sandbox` and confirm the displayed project is `FCRM`.
3. Connect or reconnect the dedicated synthetic Jira account through Atlassian OAuth.
4. Search Jira with an optional JQL filter, or select a JSON scenario and inspect its details before execution.
5. Confirm the scenario and review the step-by-step results, including any Jira error or permission response.
6. Use `cleanup-fcrm` only when the connected account is the dedicated test account and all returned `FCRM` work items may be permanently deleted.
7. Use the resulting Jira context to support the FULCRUM demo, while keeping Jira status and comments distinct from FULCRUM risk calculations and human decisions.

The operator journey is intentionally bounded by a server-side session, a fixed project key, an allowlist of scenario actions, explicit execution confirmation, synthetic-only data, and audit events. See the [Jira sandbox guide](../03-architecture/jira-sandbox.md).
