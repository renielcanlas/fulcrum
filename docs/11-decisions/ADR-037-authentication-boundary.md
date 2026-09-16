# ADR-037: FULCRUM authentication boundary

Status: Accepted

## Context

FULCRUM runs on Vercel and currently presents synthetic demo personas. The
browser must not be able to select a persona and receive an authenticated
session without server-side credential verification. Vercel functions are
ephemeral, so an in-memory session alone is not sufficient for a reliable
login experience.

Native Jira SAML/SSO is an Atlassian organization capability rather than a
portable application login mechanism. The existing Atlassian OAuth connection
is therefore an optional integration after FULCRUM authentication.

## Decision

- `/login` is the application login page with username and password fields.
- The synthetic demo-user helper fills those fields but still submits through
  the normal login form.
- The session endpoint verifies the password server-side with scrypt and sets
  a random HttpOnly, SameSite cookie.
- Session records are persisted in Neon when configured, with an in-memory
  cache for the current function instance.
- The current demo catalog remains synthetic and uses one configured demo
  password hash. `FULCRUM_DEMO_PASSWORD_HASH` is preferred; the plaintext
  `FULCRUM_DEMO_PASSWORD` fallback is for local/demo use only.
- Jira OAuth/3LO remains optional. Native Jira SSO is not a prerequisite for
  FULCRUM sign-in and is not implemented as an application-owned identity
  provider.

## Consequences

This closes the predictable-cookie and client-only persona-switch gap while
keeping the hackathon demo easy to enter. It is not yet a general user
provisioning system: production onboarding should replace the synthetic user
catalog with an approved identity provider or managed user directory, add
rate limiting and recovery, and use a managed secret for the password hash.
