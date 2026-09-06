# ADR-035 — Review-stage final outcome

Status: Accepted

## Context

The Jira workflow now treats `Decision` as an end-state concept rather than an independently evaluated swimlane. FULCRUM must still separate evidence-based evaluation from the committee’s authoritative disposition.

## Decision

FULCRUM evaluates four Jira stages: `Intake`, `Context and Research`, `Risk Assessment`, and `Review`. Review is the final evaluated stage. After a published Review evaluation recommends `Proceed`, an authorized Risk Committee member may record the final outcome. The application writes the decision comment through the FULCRUM service account and transitions Jira to exactly one terminal status: `Accepted` or `Rejected`.

The board shows `Accepted` and `Rejected` as terminal outcome lanes, colored green and red respectively. It does not add a `Decision` swimlane. AI recommendations and evaluation scores remain advisory; only the deterministic route and authorized committee action can change the terminal Jira status.

## Consequences

The Review-stage evaluation and committee outcome are visibly distinct. Existing transition and evaluation history remains inspectable in Jira comments. Jira workflows must expose transitions to `Accepted` and `Rejected`, and the service account must have permission to execute them. Reassessment after a terminal outcome is a later workflow capability.

## Related decisions

[ADR-006 — Human consequential decisions](ADR-006-human-consequential-decisions.md), [ADR-028 — Jira/FULCRUM data authority](ADR-028-jira-fulcrum-data-authority.md), [stage evaluation configuration](../../data/config/stage-evaluations.json), and [Jira sandbox architecture](../03-architecture/jira-sandbox.md).
