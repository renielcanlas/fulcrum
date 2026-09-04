# FCRM Copilot and Jira-contextual Assistant

## Purpose

The integrated AI capability supports FCRM analysts with assisted decision preparation and provides a conversational interface over a FULCRUM initiative plus its authorized Jira context. Its user-facing persona is **Ciel**, the FULCRUM AI Assistant. Ciel is not an autonomous decision-maker.

## Why the name Ciel

Ciel is a deliberate fictional reference to *That Time I Got Reincarnated as a Slime* (*Tensei Shitara Slime Datta Ken*). In that story, Rimuru’s wisdom-oriented skill develops into an AI-like partner associated with Raphael and later named Ciel. FULCRUM borrows the idea of a trusted, analytical partner—not the character’s powers or authority. Ciel helps users inspect evidence, explain deterministic calculations, surface uncertainty, and prepare next steps; authorized humans remain responsible for judgments and decisions.

The French noun *ciel* means “sky” and can also carry the sense of “heaven”; its etymological line comes through French from Latin *caelum*. The name therefore also expresses FULCRUM’s product intent: give analysts a broader view over fragmented evidence, risk context, linked work, and decision lineage. Ciel is an interface for clarity and perspective, not a replacement for governance.

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

1. FULCRUM's authoritative assessment records and Jira-backed Initiative reference.
2. Explicitly linked Jira issue/project IDs, not broad account-wide Jira search by default.
3. Selected Jira context references with source URL, issue ID/key, field name, retrieved-at timestamp, source version/hash where available, and permission/connection identity; not a full Jira issue mirror.
4. Evidence, policy references, assessment history, overrides, and unresolved questions.

The assembler applies tenant, user, project, issue, and field-level access controls before retrieval. It filters stale/deleted Jira records and marks synchronization age. Every answer stores the context manifest and retrieved references needed for replay. Jira webhooks only invalidate or schedule refresh; the assistant reads the reconciled projection.

## Interaction patterns

When a user asks Ciel to improve, reassign, or transition a linked Jira story, the backend retrieves the live issue through the server-side service-account connection. Ciel may prepare a clearer description, resolve a verified synthetic persona to its Jira account ID, or resolve a requested workflow status, but the browser must explicitly confirm the update. The deterministic Jira adapter then writes only the requested bounded field, records an audit event, and reports the exact result. Reassignment requires Jira's `Assign Issues` project permission and transition requires `Transition Issues`; read access remains available for linked `FCRM-*` issues. Unsupported fields, invented custom fields, and silent writes are rejected.

**Analyst workspace:** a side panel on the initiative shows “Ask Ciel”, evidence-backed suggestions, missing information, contradictions, and draft actions. Each suggestion has accept, edit, reject, and explain controls.

**Initiative Q&A:** “What changed in the Jira initiative since the last assessment?”, “Which delivery channels are affected?”, “What evidence supports geography risk?”, and “What remains unknown?” Answers cite individual FULCRUM/Jira sources and disclose inference.

**Assisted assessment:** the bounded assessment task produces a draft artifact; the deterministic scoring engine calculates ratings; the analyst validates inputs and rationale; bounded contradiction checks may flag support gaps; the committee receives a briefing. No model output is a decision.

## Agent topology

The deterministic `AssessmentOrchestrator` invokes bounded tasks such as `jira-context.v1`, `evidence-interpretation.v1`, `policy-synthesis.v1`, `risk-decomposition.v1`, `assessment-draft.v1`, `version-comparison.v1`, `committee-package.v1`, and `fulcrum-assistant.v1`. These are task contracts, not autonomous business agents. A future action planner remains deferred; any later proposal would have no write permission and would still require a normal authorized application command. All outputs use versioned schemas and are validated before display or persistence.

## Model strategy

Use Azure AI Foundry deployments through the AI Gateway: a lightweight route for Jira field normalization, extraction, classification, summaries, and routine chat; embeddings/reranking for retrieval; and a stronger reasoning route for risk synthesis and challenge. Keep score calculation, access checks, state transitions, source filtering, citation assembly, and audit deterministic. The model provider/deployment is selected through the existing `AIProvider` interface and recorded for every material output. Uploaded documents first pass through the separate Document Intelligence evidence pipeline.

## Human checkpoints

The analyst confirms that Jira context is relevant and current, validates extracted facts and risk observations, edits or rejects drafts, and documents overrides. A committee member decides the outcome. Disagreement preserves the original output, human action, rationale, category, identity, timestamp, and downstream impact.

## Failure behavior

If Jira is disconnected, stale, permission-denied, contradictory, or unavailable, the assistant says so and answers only from remaining governed context. It does not guess or silently use another connection. If evidence is insufficient, it returns `UNKNOWN` and creates a clarification or analyst-review item.
