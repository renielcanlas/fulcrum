# ADR-001: AI-native connected SDLC

Status: Proposed. Requirements: REQ-012–REQ-015.

## Context

The hackathon must demonstrate AI across requirements, design, development, testing, deployment, and operations without creating disconnected demos or private context silos.

## Decision

Each stage consumes and produces versioned repository artifacts: requirements and research → architecture/ADRs/contracts → implementation summary → tests/evaluations → deployment validation/release notes → operational analysis/feedback. Requirement IDs and schemas connect stages; humans review material domain, security, release, and governance decisions.

## Alternatives

Ad hoc chat transcripts, or six isolated agent demos. Both are difficult to reproduce, audit, and hand off.

## Consequences

Agents can be interchangeable across Codex, Claude Code, Copilot, Gemini, and others, but artifact schemas and review gates become part of the product discipline. Token/context budgets and evaluation evidence are visible engineering outputs.
