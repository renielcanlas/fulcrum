# AI orchestration

The initial implementation uses one governed Copilot orchestrator with typed read tools and a provider-neutral `AIProvider`. It is intentionally not a fleet of autonomous agents. The orchestrator supplies scoped active-assessment context, executes only allowlisted backend tools, feeds structured tool results back to the model, and records an auditable interaction. See [ADR-003](../11-decisions/ADR-003-fcrm-copilot-and-jira-context.md).
