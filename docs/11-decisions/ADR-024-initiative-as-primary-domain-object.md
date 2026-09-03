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

Use `Initiative` as the primary user-facing FULCRUM reference and navigation object. It correlates to the Jira-authoritative business initiative and links the FULCRUM assessment, evidence references, findings, decisions, conditions, participants, Jira references, and FCRM activity. The governed assessment aggregate owns risk and decision state; `ChangeRequest` remains a compatibility term during implementation migration and must not become a second source of truth. The Jira/FULCRUM authority boundary is refined by [ADR-028](ADR-028-jira-fulcrum-data-authority.md).

## Rationale

Initiative remains the clearest product-facing entry point for decision intelligence while the authority split prevents FULCRUM from becoming a project-management duplicate of Jira.

## Consequences

The data model, UI, APIs, and glossary should use `Initiative` as the navigation/reference object and `Assessment` as the governed FCRM aggregate. Existing references require an explicit migration/alias plan. Jira issue links are authoritative business-context correlations, not FULCRUM-owned issue copies; Jira does not own the FCRM assessment or decision.

## Production Evolution

Production schema migration should preserve stable IDs and historical audit references while renaming or aliasing legacy `ChangeRequest` fields. No destructive migration is permitted.

## Related Decisions

ADR-005, ADR-023, and [product direction](../00-context/product-direction.md).
