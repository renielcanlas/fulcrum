# Agent registry

Each agent or bounded AI task must have a versioned contract based on `contract-template.yaml` or the contracts in [the repository contract catalogue](../../docs/05-ai/agent-and-tool-contracts.md). Contracts define inputs, outputs, context, tools, permissions, prohibited actions, model requirements, evaluation, validation, fallback, and escalation. The orchestrator, not an agent, owns sequencing and human gates. FULCRUM currently requires no autonomous agents for the hackathon.
