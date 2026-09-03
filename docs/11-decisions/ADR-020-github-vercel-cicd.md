# ADR-020: GitHub-driven CI/CD

Status: Accepted. Requirements: REQ-013, REQ-028.

## Decision

Use GitHub pull requests and checks followed by Vercel Preview deployments; merge to `main` produces the stable Demo/Production-shaped deployment.

## Consequences

The flow is easy for a solo developer to operate. Branch protections and environment approvals should be added before production use.
