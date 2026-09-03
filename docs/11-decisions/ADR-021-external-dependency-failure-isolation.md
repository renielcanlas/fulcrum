# ADR-021: External dependency failure isolation

Status: Accepted. Requirements: REQ-009, REQ-017, REQ-028.

## Decision

Jira and OpenAI failures degrade only their capabilities, preserve FULCRUM authority, record failures, and retry where safe. Database failures reject business mutations. Required audit failure blocks consequential completion where practical.

## Consequences

Users see explicit degraded/pending status, and asynchronous reconciliation becomes necessary. The app avoids invalid rollbacks caused by an unrelated SaaS outage.
