# ADR-016: Managed serverless deployment model

Status: Accepted. Requirements: REQ-013, REQ-015, REQ-028.

## Decision

Use Vercel’s managed Next.js execution for web/API requests and avoid Kubernetes, VMs, and custom gateways until a measured requirement exists. Long-running work evolves to external workers/queues.

## Consequences

The app must be stateless at the function boundary, externalize sessions/audit/jobs, and respect function duration/concurrency limits.
