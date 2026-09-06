# Ciel action planning

FULCRUM uses Azure AI as a planning and language layer, not as the authority for Jira mutations.

For supported Jira actions, Ciel receives the request, live Jira context, recent conversation, and the verified synthetic persona catalog. Azure returns one structured JSON action plan containing:

- the classified intent
- the issue key and normalized target, when present
- whether confirmation is required
- concise pending, success, and failure response templates

The backend then validates the plan, resolves persona aliases to the stored Jira account mapping, executes the existing typed Jira capability, refetches Jira, and verifies the result. Fulcrum selects the response template locally using the verified outcome. It does not ask the model to decide whether Jira succeeded and does not need a second model call for these actions.

```text
request → Azure action plan → Fulcrum validation → confirmation
        → typed Jira command → Jira refetch/verification → selected response
```

The response templates are request-specific, so they are generated with each action request. The durable policy and output schema remain in server-side instructions and code. This avoids putting credentials or execution authority in the model while allowing Ciel to use the current issue and conversation context.

If the action plan is invalid or unavailable, the route falls back to the existing conversational response path. Generic questions are not forced through the action-plan schema.

The implementation currently applies this path to the supported Ciel Jira assignment, transition, and story-description update flows. New capabilities should add a typed backend command, verification logic, tests, and an explicit action-plan intent before they are exposed to Ciel.

For assignment, an explicit persona name or Fulcrum persona code in the user message takes precedence over the model's proposed target. If no valid target can be resolved, Ciel makes one corrective planning request with the verified catalog before asking the user for clarification.

The Ciel route also resolves the active Fulcrum session. When the user says “assign it to me” or “assign it to myself,” the backend maps that phrase to the current session persona before executing Jira assignment; it does not ask Azure to infer the identity.

The normal path is intentionally short: one focused planning call, deterministic Fulcrum execution and Jira verification, then a local response. Only an invalid or incomplete plan triggers one targeted repair call. Context is scoped to the latest conversation turns and task-relevant Jira or persona data rather than sending the entire session on every request.

When `CIEL_DEBUG=true`, the Ciel route emits a deliberately small server log trail:

1. the actual user message received
2. that Ciel sent a message to Azure
3. the actual Azure response
4. the action Ciel selected after reading Azure's response
5. the action type when a Jira action starts
6. the verified action result
7. the response returned to the user

The flag is intended for local troubleshooting and should remain disabled in production.
