# Jira sandbox user guide

Status: implemented hackathon guide. The sandbox uses synthetic Jira work only and is separate from FULCRUM’s authoritative assessment and decision workflow.

## What the sandbox is for

Use `/sandbox` to inspect the server-side Jira connection, search the fixed `FCRM` project, generate or edit synthetic scenarios, preview validation, and execute confirmed Jira operations. It is an engineering experiment surface, not a production Jira automation engine.

## What you can see

- **Jira search**: normalized FCRM issues with key, summary, status, assignee, type, dates, and Jira links.
- **Connection indicators**: Jira service-account status and Azure AI status in the app bar.
- **Scenario source selector**: checked-in JSON scenarios plus **Custom scenario**.
- **Scenario details**: description, ordered steps, action names, and validation indicators.
- **FULCRUM work-item view**: selecting a Jira key opens an independent FULCRUM detail page; the external Jira link is available from that detail page.
- **JSON view**: the current scenario JSON for inspection.
- **AI scenario assistant**: a prompt area for creating or revising a scenario.
- **Ciel chat**: the read-only FULCRUM AI Assistant used in the demo, available from the floating ✦ button without signing in. It answers against the synthetic Golden Initiative context; it does not execute Jira scenarios.
- **Import JSON**: loads a local `.json` file into the editor.
- **Save JSON**: downloads the current valid scenario.
- **Clear**: resets the custom JSON, AI prompt, and generation error.
- **Execution dialog**: preflight result, step progress, Jira errors, copy-error control, and rollback for issues created during a failed run.

## Create a scenario with AI

1. Open `/sandbox` and choose **Scenario automator**.
2. Select **Custom scenario**.
3. Leave the JSON editor empty for a new scenario, or import/paste existing JSON to give the assistant context.
4. Describe the experiment. For example:

   > Create two synthetic FCRM Tasks for Apple Pay research, assign one to Daniel Reyes, add a kickoff comment, and move the work through the available workflow statuses. Use only supported fields and persona codes.

5. Select **Generate scenario**.
6. Watch the phase indicator: drafting, validating, refining, and applying.
7. The first draft appears in the JSON editor immediately. It is not executable until validation passes.
8. Review the step indicators and the JSON. Azure may receive up to three repair requests when validation finds a problem.
9. Confirm execution only after the scenario is valid and the intended changes are understood.

## Ask Ciel from the sandbox

Select the floating ✦ button from any sandbox view and ask the FULCRUM AI Assistant about the synthetic assessment, its evidence, risk findings, decision trail, or linked work. In the demo board, Jira context is attached only when the question appears related to the board or a work item; unrelated questions do not receive the board payload. Relevant answers can link to the FULCRUM work-item view and the remote Jira issue. The sandbox uses a fixed synthetic analyst identity and assessment scope so the chat can be demonstrated without a FULCRUM login. Ciel remains read-only: it can explain retrieved facts and system calculations, but it cannot change the scenario, Jira, scores, workflow, or decisions.

## Persona assignment format

Use stable persona codes instead of names or Atlassian IDs:

```json
{
  "action": "assign",
  "personaId": "analyst-7"
}
```

For an update step:

```json
{
  "action": "update",
  "fields": {
    "assigneePersona": "committee-1"
  }
}
```

The server maps the code to the configured Atlassian account ID. Assignment still requires Jira Assign Issues permission and target-user Jira access.

## Supported scenario actions

The sandbox supports `create`, `update`, `transition`, `assign`, `comment`, and `delete_all`.

Create steps should use `summary`, `description`, `issueType: "Task"`, and `labels`. Update steps should use supported Jira fields such as `summary`, `description`, `priority`, `labels`, `assigneePersona`, or `duedate`. Do not invent fields such as `ResearchOwner`, `ResearchPriority`, or `Notes`; Jira custom field IDs and allowed values must be deliberately configured before support is added.

Transition targets are intents, not hardcoded Jira transition IDs. The server resolves the available transition for the issue and matches the English FCRM workflow names: `Intake`, `Context and Research`, `Risk Assessment`, `Review`, and `Decision`.

## Validation indicators

- Gray number: not validated yet, or after the first failing step.
- Green check: the step is valid and occurs before the first failure, or the complete scenario passed validation.
- Red exclamation mark: the step contains the first identified validation problem. Hover it for the error detail.

The validator runs once for the visible initial draft. Azure refinement is bounded at three retries. A failed refinement leaves the initial draft in place and does not execute it automatically.

## Execute and recover

The execution dialog provides a final preflight check before Jira mutation. Execution is sequential and stops on the first failure. A successful create returns a Jira issue key and link. If a later step fails, **Rollback** can delete issues created by that run, subject to Jira Delete Issues permission. Updates, comments, and transitions to pre-existing issues are not automatically reversible.

## Cleanup

Cleanup is intentionally separate from AI generation. Select the checked-in cleanup scenario only when connected to the dedicated synthetic FCRM project, read the warning, and confirm the operation. It permanently deletes every work item returned by the fixed FCRM project search. Do not use cleanup against production or real customer data.

## Common failures

- **Permission needed**: grant the service account product access and the relevant FCRM project permission.
- **Invalid assignee**: use a persona code and confirm the service account can assign issues.
- **Invalid field / Atlassian document error**: remove invented fields and send notes as a comment or description.
- **Invalid transition**: use the current issue’s available workflow target; transition availability depends on the issue’s current state.
- **Azure refinement failure**: keep the initial JSON, correct the indicated step, or ask the assistant to revise it again.
- **Board appears empty**: search FCRM from the sandbox and open the returned issue link. The board may hide completed issues or apply a board filter that excludes the item.

## Safety boundary

All AI output is a draft. Deterministic validation, server-side permission checks, explicit human confirmation, and Jira’s own authorization remain authoritative. The AI cannot approve or reject FULCRUM decisions, change risk calculations, bypass permissions, or silently mutate Jira without the confirmed application command.
