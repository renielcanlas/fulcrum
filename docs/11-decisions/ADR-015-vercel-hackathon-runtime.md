# ADR-015: Vercel for hackathon deployment

Status: Proposed. Requirements: REQ-028.

## Context

Solo-developer delivery needs a low-operations path for a Next.js web app with server-side AI/Jira calls.

## Decision

Use Vercel as the hackathon build, Preview, and Demo/Production-shaped deployment platform.

## Alternatives

GitHub Pages, a VM, Kubernetes, or a dedicated container platform. GitHub Pages cannot host server-side credentials/API routes; the others add infrastructure overhead not justified by the hackathon.

## Consequences

Fast CI/CD and Preview deployments are available. Durable state, jobs, and enterprise controls remain external/production-target concerns.
