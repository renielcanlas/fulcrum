# Agent map and contracts

The orchestrator sequences these bounded agents: `intake.v1` (normalize, gaps, questions), `document-intelligence.v1` (facts and source spans), `jira-context.v1` (permission-filtered linked-initiative context), `policy-research.v1` (retrieval and citations), `risk-decomposition.v1` (factor observations and gaps), `assessment.v1` (draft), `challenge.v1` (contradictions and unsupported claims), `committee-briefing.v1` (decision package), and `fulcrum-assistant.v1` (grounded Q&A). An optional `action-planner.v1` prepares proposed actions without write permission. None can approve/reject, alter scores/configuration, bypass authorization, broaden Jira access, or write authoritative state directly.

Every contract specifies: ID/version; purpose; typed inputs/outputs; context allowlist; tools; permissions; prohibited actions; model class; evaluation metrics; schema validation; fallback; retry/idempotency; escalation; and human checkpoint. Canonical contract templates and schemas live in `.ai/agents/` and `.ai/schemas/`. Agent output is a proposal artifact; application commands validate and persist it.

Suggested model routing: lightweight model for extraction/classification, embedding model for retrieval, stronger model for synthesis/challenge, deterministic code for scoring. Provider and model are configuration, never domain dependencies.
