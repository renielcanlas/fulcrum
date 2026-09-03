# ADR-025 — Canonical golden initiative fixture

## Status

Accepted

## Context

The first end-to-end demo needs realistic relationships across initiative intake, evidence, risk, controls, AI observations, analyst governance, committee decision, conditions, and Jira links. A remittance-specific implementation would make the demo difficult to extend.

## Decision

Use `data/demo/golden-initiative.json` as the canonical synthetic fixture. It represents a generic Initiative and assessment version, with remittance values supplied as data. All material AI findings must carry source references and require human review; the fixture includes one explicit analyst override and one committee decision with conditions.

## Consequences

Demo tools and future integration tests have a stable, judge-readable dataset. New scenarios should conform to the same schema and generic workflow contracts. The data is synthetic and must not be presented as regulatory advice or real institution/customer information.

## Related decisions

[ADR-024 — Initiative as the primary domain object](ADR-024-initiative-as-primary-domain-object.md), [Golden Initiative demo](../04-domain/golden-initiative-demo.md), and [Golden Initiative contracts](../04-domain/golden-initiative-contracts.md).
