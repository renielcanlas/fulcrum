# AI execution observability

FULCRUM records one redacted execution record for each provider call. The record is created by `InstrumentedProvider` in [`src/ai/provider.js`](../../src/ai/provider.js), normalized by [`src/ai/execution-record.js`](../../src/ai/execution-record.js), and stored/exported by [`src/observability/ai-telemetry.js`](../../src/observability/ai-telemetry.js).

The Next.js root layout also enables Vercel Web Analytics and Speed Insights. Web Analytics covers page usage, while Speed Insights covers Core Web Vitals; neither is treated as model telemetry.

Each record includes the run and correlation IDs, task contract, provider, deployment, instruction version, assessment/user references, call type, input hash, tool names, latency, token usage when returned, status, and a bounded error class/message. Raw prompts, outputs, credentials, and hidden chain-of-thought are not recorded.

The telemetry store emits an OpenTelemetry span named `fulcrum.ai.<task>`. The Vercel OTel initializer in [`instrumentation.js`](../../instrumentation.js) exports these spans to Vercel Tracing/Observability, alongside automatic route and outbound-fetch spans. When `APPLICATIONINSIGHTS_CONNECTION_STRING` is configured, the same redacted AI spans are also exported to Azure Application Insights through the Azure Monitor OpenTelemetry exporter. This keeps Vercel route/session tracing and Azure model-operational telemetry available together without sending prompts or responses.

Azure OpenAI resource metrics and diagnostic logs are configured separately in Azure Monitor. Enable the approved request/usage metrics on the Azure OpenAI resource and route them to the Application Insights workspace; do not enable raw prompt/response capture for this synthetic demo. The current application telemetry store is in-memory; durable PostgreSQL persistence remains a later increment.

AI execution telemetry is operational evidence, not authoritative audit. Existing deterministic audit events remain the business/governance record and can use the AI correlation ID to relate an action to model activity.

Focused coverage is in [`test/ai-telemetry.test.js`](../../test/ai-telemetry.test.js). Provider usage fields are nullable when a provider or streaming response does not return token counts; the application does not fabricate measurements.
