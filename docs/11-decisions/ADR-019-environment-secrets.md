# ADR-019: Environment-based secrets for the demo

Status: Accepted. Requirements: REQ-027, REQ-028.

## Decision

Use local `.env` and Vercel environment variables for the hackathon, with `.env` ignored and `.env.example` names only. Production evolves to a managed enterprise secret manager/KMS behind a stable secret-access interface.

## Consequences

Secrets are easy to configure but require per-environment separation, rotation/redeploy discipline, log redaction, and no public variable prefixes.
