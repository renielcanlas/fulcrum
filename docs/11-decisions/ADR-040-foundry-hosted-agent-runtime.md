# ADR-040: Use a published Foundry agent as the Ciel language runtime

Status: Accepted

Date: 2026-10-01

## Context

FULCRUM now has a provider-neutral AI gateway and an Azure model-deployment adapter. The team has also configured a published Microsoft Foundry prompt agent with Ciel instructions and an indexed FCRM knowledge base. The hosted agent must be usable by the application without moving FULCRUM's authoritative workflow, scoring, authorization, or audit responsibilities into the model.

## Decision

Add an opt-in `FoundryHostedAgentProvider` that calls the Foundry project agent endpoint using the OpenAI-compatible Responses contract. The provider uses Microsoft Entra bearer authentication through `DefaultAzureCredential`, with an explicitly supported short-lived bearer-token override for local testing. The Foundry agent is selected only when `AZURE_AI_FOUNDRY_AGENT_ENABLED=true` and the project endpoint and agent name are configured.

The hosted agent supplies stored instructions and indexed knowledge. FULCRUM remains responsible for scoped live context, deterministic tools, authorization, state transitions, scoring, Jira commands, confirmation, verification, audit, and human decisions. Hosted-agent responses do not use the OpenAI Responses `previous_response_id` continuation mechanism; the application keeps the bounded recent transcript when needed.

When enabled, all model-backed calls select the hosted agent first. A bounded failover wrapper uses the configured OpenAI provider when Foundry is unavailable, content-filtered, unable to produce valid JSON for a structured task, or cannot execute application-local tools. This fallback does not transfer authoritative decision authority to the model.

The existing Azure model-deployment adapter remains available as a fallback and as a portability path for structured tasks that require application-owned prompt and schema control.

## Consequences

- Ciel and evaluation decision-support calls can use the team's Foundry-indexed FCRM guidance without duplicating that corpus in application prompts.
- Foundry configuration is server-only and can use managed identity or workload identity.
- Hosted-agent health checks validate the configured agent endpoint without exposing the project endpoint or credentials to the browser.
- Local and integration tests can inject a fake credential and fetch implementation.
- A future change that exposes FULCRUM tools directly to the hosted agent requires a separate reviewed tool contract; prompt text alone cannot grant access.

## Traceability

- REQ-005, REQ-018, REQ-026, REQ-031
- `docs/05-ai/azure-ai-foundry-and-document-intelligence.md`
- `docs/05-ai/agent-and-tool-contracts.md`
