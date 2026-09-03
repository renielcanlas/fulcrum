# ADR-027 — Immutable assessment version bindings and governed configuration lifecycle

## Status

Accepted

## Context

FULCRUM must explain historical assessments after scoring models, risk taxonomy, controls, policies, workflow rules, or AI instructions change. A reference to the current or latest configuration is insufficient for examiner replay and can silently change the meaning of a past decision.

## Decision

Treat `AssessmentVersion` as the immutable historical decision boundary after finalization. Bind each version to an immutable `VersionBindingManifest` containing the exact source document versions, accepted facts, scoring model and parameters, risk taxonomy, control/evaluation configuration, policy citations, workflow/material-change configuration, and relevant AI run/instruction/retrieval references.

Use explicit configuration lifecycles:

```text
Draft → Reviewed → Active → Retired
```

Configuration activation is explicit, authorized, effective-dated, content-hashed, and audited. A configuration change never rewrites a historical assessment. Impact analysis may flag or queue a new assessment version for optional or mandatory reassessment.

Use optimistic concurrency for mutable drafts and operational records. Material changes create a new `AssessmentVersion` with a parent reference; corrections and overrides preserve original values through immutable records.

## Rationale

The binding manifest makes historical replay direct and deterministic without requiring full event sourcing or a graph database. It separates current operational projections from historical authority and preserves the distinction between AI proposals, deterministic calculations, analyst dispositions, and committee decisions.

## Hackathon application

The demo needs one visible configuration ID/hash, one editable draft/revision path, one material-change successor example, activation/audit evidence, and exact source/configuration references. A full configuration-management portal, automated impact scheduler, and enterprise approval workflow are deferred.

## Consequences

The physical schema must store version IDs, predecessor/supersession links, binding manifests, content hashes, effective dates, and concurrency tokens. Configuration and historical records require more storage and explicit queries, but current configuration cannot corrupt historical meaning.

## Related decisions

[ADR-008 — Version assessments instead of destructive mutation](ADR-008-assessment-versioning.md), [ADR-010 — Dependency-aware selective reassessment](ADR-010-selective-reassessment.md), [Evidence & Decision Lineage](../04-domain/evidence-and-decision-lineage.md), and [Versioning & Configuration Model](../04-domain/versioning-and-configuration-model.md).

