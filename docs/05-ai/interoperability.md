# AI interoperability and handoffs

Codex, Claude Code, Claude, Copilot, Gemini, and compatible agents use the same repository context, requirement IDs, schemas, ADRs, and artifact directories. Tool adapters may explain how to load context but must not fork requirements. The durable handoff is `task → requirements → files/artifacts changed → decisions → unresolved questions → tests → risks → next action`.

Example chain: implementation agent writes `implementation-summary.json`; review agent writes `review-result.json`; test/evaluation agent writes `test-results.json` and `evaluation-result.json`; human reviews material findings. Templates and schemas are in `.ai/handoffs/` and `.ai/schemas/`.
