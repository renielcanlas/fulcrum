# ADR-024 — Initiative as the primary domain object

## Status

Accepted

## Context

FULCRUM needs a domain object that represents the proposed business change and unifies its business context, FCRM assessment, evidence, controls, decisions, conditions, and history. `ChangeRequest` was used in the initial conceptual model, while product direction consistently describes an Initiative.

## Decision Drivers

Product clarity, financial-crime decision intelligence, traceability, integration boundaries, user comprehension, and compatibility with existing conceptual artifacts.

## Options Considered

Use `ChangeRequest` as the user-facing object; use `Initiative` as the primary object; or use separate business and assessment objects with no central aggregate.

## Decision

Use `Initiative` as the primary user-facing and domain aggregate. It owns the proposed business change and links assessment versions, evidence, controls, findings, decisions, conditions, participants, Jira references, and activity history. `ChangeRequest` remains a compatibility term during implementation migration and must not become a second source of truth.

## Rationale

Initiative better represents the full decision-intelligence lifecycle and keeps business context, assessment, and decision history discoverable in one place without turning FULCRUM into project-management software.

## Consequences

The data model, UI, APIs, tools, and glossary should converge on `Initiative`. Existing references require an explicit migration/alias plan. Jira issue links remain projections/integrations, not ownership of the Initiative or its decision.

## Production Evolution

Production schema migration should preserve stable IDs and historical audit references while renaming or aliasing legacy `ChangeRequest` fields. No destructive migration is permitted.

## Related Decisions

ADR-005, ADR-023, and [product direction](../00-context/product-direction.md).
