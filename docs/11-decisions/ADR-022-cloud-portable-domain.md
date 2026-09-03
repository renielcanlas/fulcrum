# ADR-022: Cloud-portable domain architecture

Status: Proposed. Requirements: REQ-013, REQ-028.

## Decision

Keep FULCRUM domain/application services independent of Vercel, Next.js, Supabase, OpenAI, and Jira. Platform adapters implement hosting, persistence, secrets, AI, and integration concerns.

## Consequences

The hackathon is faster while the domain can move to an approved Azure/AWS/bank platform. Adapter contracts and deployment-specific tests become required.
