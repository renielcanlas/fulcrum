# ADR-014: Next.js application deployed to Vercel

Status: Proposed. Requirements: REQ-013, REQ-015, REQ-018, REQ-019, REQ-027.

## Context

FULCRUM needs an embedded web UI, server-side AI/Jira integrations, streaming Copilot responses, secure environment configuration, and a practical hackathon deployment path. The current hand-rolled Node server is not a durable process or persistence architecture.

## Decision

Use Next.js App Router for the web application and backend route handlers, deploy the web tier to Vercel, and keep domain modules framework-neutral. Persist authoritative data, sessions, audit, conversations, and jobs outside function memory. Use external workers/queues for long-running processing.

## Alternatives

Keep the raw Node server on a VM/container; use a client-only React app with a separate API; or deploy the existing server directly to Vercel. A VM/container is viable later for workers, client-only UI weakens server-side security boundaries, and direct Vercel deployment of the current server risks ephemeral in-memory state and does not use the platform’s framework path.

## Consequences

The team gains a coherent UI/API deployment model and easy Preview deployments, but must migrate the current server, introduce durable persistence, handle function duration/streaming limits, and configure environment variables per deployment environment. Vercel is the web tier, not automatically the database, queue, secret manager, or enterprise IAM.
