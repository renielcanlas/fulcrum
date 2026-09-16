# Agent registry

Each agent or bounded AI task must have a versioned contract based on `contract-template.yaml` or the contracts in [the repository contract catalogue](../../docs/05-ai/agent-and-tool-contracts.md). Contracts define inputs, outputs, context, tools, permissions, prohibited actions, model requirements, evaluation, validation, fallback, and escalation. The orchestrator, not an agent, owns sequencing and human gates. FULCRUM's user-invocable repository agents are bounded development assistants, not autonomous production decision-makers.

The [FULCRUM Test Generator](./test-generator.v1.yaml) has a corresponding [coding-agent instruction](../../.github/agents/test-generator.agent.md). Use it to generate or extend deterministic Node tests and Playwright UAT tests while preserving synthetic fixtures, authorization, human gates, and browser evidence capture.
