# ADR-011: Security and governance architecture

Status: Accepted. Requirements: REQ-015, REQ-016, REQ-018, REQ-020, REQ-021.

## Context

FULCRUM handles sensitive risk-assessment workflows and must demonstrate security without pretending the hackathon has enterprise IAM or production banking data.

## Decision

Use synthetic demo personas with server-side sessions, application-owned RBAC, isolated Jira OAuth, backend-only model credentials, bounded AI tools, human-only consequential decisions, versioned configuration, AI provenance, and append-only audit. Document production controls separately.

## Alternatives

Jira as identity provider, frontend-only role checks, direct model/database access, credentials in browser, or full enterprise IAM in the demo. These either violate domain boundaries or add complexity without improving the judged prototype.

## Consequences

The demo is easy to operate and exposes the critical security boundaries, but persona login is not production authentication. A production deployment requires enterprise identity, managed secrets/KMS, stronger audit storage, monitoring/SIEM, lifecycle provisioning, and formal security review.
