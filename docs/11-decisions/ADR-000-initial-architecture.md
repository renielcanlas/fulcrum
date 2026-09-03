# ADR-000: Initial architecture

Status: Accepted. Requirements: REQ-001–REQ-015.

## Context

FULCRUM needs fast, explainable assessment preparation for sensitive cases while preserving human accountability, configurable rules, provenance, and interoperability among AI coding agents.

## Decision

Use a modular application with governed relational/object data, retrieval, asynchronous agent orchestration, an AI provider gateway, deterministic workflow/scoring/configuration, application-enforced authorization, and append-only audit. Agents emit validated proposal artifacts; only authorized application commands mutate authoritative state. Use demo adapters for unavailable enterprise systems.

## Alternatives

An autonomous agent; conventional CRUD plus chatbot; or many microservices. The first violates governance, the second weakens structured reasoning/provenance, and the third adds operational complexity before scale evidence.

## Reasoning and consequences

This cleanly separates probabilistic understanding from deterministic governance and supports traceable agent handoffs. It requires schema discipline, orchestration, evaluation, and a later scaling decision. It also keeps provider replacement feasible. Status and all regulatory mappings remain subject to FCRM/security review.
