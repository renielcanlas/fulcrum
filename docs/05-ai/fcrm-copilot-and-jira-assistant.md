# FCRM Copilot and Jira-contextual Assistant

## Purpose

The integrated AI capability supports FCRM analysts with assisted decision preparation and provides a conversational interface over a FULCRUM initiative plus its authorized Jira context. It is a copilot, not an autonomous decision-maker.

## What the copilot does

- Summarizes the initiative, proposed change, Jira-linked delivery scope, and assessment status.
- Extracts and normalizes relevant Jira facts such as project, issue type, summary, description, labels, status, assignee, dates, links, comments, and selected custom fields.
- Identifies potentially relevant risk factors, missing information, contradictions, scope changes, and stale assumptions.
- Retrieves applicable FULCRUM policies, approved research, prior assessments, and Jira evidence.
- Drafts assessment sections, clarification questions, analyst challenge prompts, and committee briefings.
- Explains the deterministic score by showing factor inputs, parameter version, threshold, calculation trace, and supporting evidence.
- Answers initiative questions with citations and explicit labels: `FACT`, `JIRA EVIDENCE`, `FULCRUM EVIDENCE`, `INFERENCE`, `RECOMMENDATION`, or `UNKNOWN`.

## What it never does

It never approves, rejects, defers, imposes conditions, changes a risk rating, changes scoring parameters, advances a human gate, expands Jira scope, or treats Jira status/comments as policy authority. It cannot access Jira resources the signed-in user is not allowed to access. It may propose an application command, but a human and deterministic authorization layer must execute it.

## Context assembly

The `InitiativeContextAssembler` builds a scoped context package from:

1. FULCRUM's authoritative initiative and assessment records.
2. Explicitly linked Jira issue/project IDs, not broad account-wide Jira search by default.
3. A normalized Jira projection with source URL, issue ID/key, field name, retrieved-at timestamp, source version/hash where available, and permission/connection identity.
4. Evidence, policy references, assessment history, overrides, and unresolved questions.

The assembler applies tenant, user, project, issue, and field-level access controls before retrieval. It filters stale/deleted Jira records and marks synchronization age. Every answer stores the context manifest and retrieved references needed for replay. Jira webhooks only invalidate or schedule refresh; the assistant reads the reconciled projection.

## Interaction patterns

**Analyst workspace:** a side panel on the initiative shows “Ask FULCRUM”, evidence-backed suggestions, missing information, contradictions, and draft actions. Each suggestion has accept, edit, reject, and explain controls.

**Initiative Q&A:** “What changed in the Jira initiative since the last assessment?”, “Which delivery channels are affected?”, “What evidence supports geography risk?”, and “What remains unknown?” Answers cite individual FULCRUM/Jira sources and disclose inference.

**Assisted assessment:** the assessment agent produces a draft artifact; the deterministic scoring engine calculates ratings; the analyst validates inputs and rationale; the challenge agent tests support and contradictions; the committee receives a briefing. No model output is a decision.

## Agent topology

The orchestrator invokes `jira-context.v1` for normalized, permission-filtered context; `risk-decomposition.v1` for observations; `assessment.v1` for drafting; `challenge.v1` for critique; and `fulcrum-assistant.v1` for read-only conversational answers. A separate `action-planner.v1` may prepare a proposed FULCRUM or Jira action, but it has no write permission. All outputs use versioned schemas and are validated before display or persistence.

## Model strategy

Use a lightweight model for Jira field normalization and classification, embeddings/reranking for retrieval, and a stronger reasoning model for synthesis and challenge. Keep score calculation, access checks, state transitions, source filtering, citation assembly, and audit deterministic. The model provider is selected through the existing `AIProvider` interface and recorded for every material output.

## Human checkpoints

The analyst confirms that Jira context is relevant and current, validates extracted facts and risk observations, edits or rejects drafts, and documents overrides. A committee member decides the outcome. Disagreement preserves the original output, human action, rationale, category, identity, timestamp, and downstream impact.

## Failure behavior

If Jira is disconnected, stale, permission-denied, contradictory, or unavailable, the assistant says so and answers only from remaining governed context. It does not guess or silently use another connection. If evidence is insufficient, it returns `UNKNOWN` and creates a clarification or analyst-review item.
