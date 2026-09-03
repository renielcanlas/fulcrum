# Failure isolation, observability, and scaling

## Failure isolation

Jira failure marks synchronization pending/failed and retries without rolling back a valid FULCRUM transaction. OpenAI failure records the AI failure and permits manual workflow where reasonable; it never skips a governance gate. Database failure rejects the business mutation and does not report success. Audit failure blocks consequential events where practical rather than silently completing the decision. Error responses are controlled and carry correlation IDs.

## Baseline observability

Use structured Vercel/runtime logs and capture deployment commit, request/correlation ID, route, latency, AI/Jira/database errors, function duration, authorization failures, and token usage. Do not log secrets, OAuth tokens, API keys, full confidential payloads, or unnecessary prompts. Separate operational telemetry from immutable audit.

## Scaling path

The natural path is stateless Next.js/Vercel execution, managed PostgreSQL with connection pooling, external session/rate-limit state, and asynchronous workers for OCR, embeddings, bulk Jira sync, and long-running AI tasks. Control Jira/OpenAI concurrency and rate limits. Do not add Kubernetes or a dedicated gateway for the hackathon.
