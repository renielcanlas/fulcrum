# AI execution observability

FULCRUM records one redacted execution record for each provider call. The record is created by `InstrumentedProvider` in [`src/ai/provider.js`](../../src/ai/provider.js), normalized by [`src/ai/execution-record.js`](../../src/ai/execution-record.js), and stored/exported by [`src/observability/ai-telemetry.js`](../../src/observability/ai-telemetry.js).

Each record includes the run and correlation IDs, task contract, provider, deployment, instruction version, assessment/user references, call type, input hash, tool names, latency, token usage when returned, status, and a bounded error class/message. Raw prompts, outputs, credentials, and hidden chain-of-thought are not recorded.

The telemetry store emits an OpenTelemetry span named `fulcrum.ai.<task>`. With `APPLICATIONINSIGHTS_CONNECTION_STRING` configured, the Azure Monitor OpenTelemetry initializer in [`instrumentation.js`](../../instrumentation.js) exports these spans to Azure Application Insights. The current store is in-memory for the synthetic demo; durable PostgreSQL persistence remains a later increment.

AI execution telemetry is operational evidence, not authoritative audit. Existing deterministic audit events remain the business/governance record and can use the AI correlation ID to relate an action to model activity.

Focused coverage is in [`test/ai-telemetry.test.js`](../../test/ai-telemetry.test.js). Provider usage fields are nullable when a provider or streaming response does not return token counts; the application does not fabricate measurements.
