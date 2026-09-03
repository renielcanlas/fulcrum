# ADR-012: Demo persona selector and production identity boundary

Status: Accepted. Requirements: REQ-015.

## Decision

The hackathon uses a seeded persona selector with opaque server-side sessions and no passwords. Production will replace the selector with enterprise OIDC/SAML, MFA, IAM provisioning, and deprovisioning. Jira OAuth remains a separate integration authorization flow.

## Rationale and consequence

This demonstrates role behavior without building banking identity infrastructure. The selector must be visibly labeled demo-only and cannot be accepted as a production control.
