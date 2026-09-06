# Stage-aware AI decision support

FULCRUM’s stage evaluations have two deliberately separate layers:

1. The deterministic evaluator reads the versioned stage configuration and owns the score, weights, threshold, and authoritative `recommendation`.
2. The bounded Azure AI decision-support task reviews the current Jira item, its recent comments, attachment inventory, and the deterministic result. It returns a reviewable proposal with a second recommendation, rationale, per-check observations, and a draft Jira comment.

The same capability is available for Intake, Context and Research, Risk Assessment, Review, and Decision. Each stage has its own `aiParameters` in `data/config/stage-evaluations.json`: a purpose, questions, and evidence priorities. The prompt explicitly identifies the current stage and tells the model not to evaluate another stage, so a strong result at one stage is not silently reused as evidence for a later stage.

The configurable scoring file also defines the partial-credit factor, recommendation bands, each checklist weight, and the final decision weighting. The default is 25% automatic checklist score and 75% AI checklist score. The backend applies the configured weights to the AI’s per-check states (`pass`, `partial`, `fail`, or `uncertain`) and calculates the combined decision against the configured threshold. This makes the comparison visible without allowing the model to choose its own weights or thresholds. Missing AI check reviews are `uncertain` and contribute zero points.

The live route is `POST /api/jira/assessment/ai` with `{ "issueKey": "FCRM-80", "stage": "Risk Assessment" }`. The `stage` must match the item’s current Jira status. It uses the configured Jira service-account connection for the read and returns:

- `assessment`: the deterministic result for the current stage;
- `assessment.weightedDecision`: the persisted score, maximum score, and weighted recommendation;
- `assessment.aiDecisionSupport`: the constrained AI proposal, including a challenge to the idea, potential benefits, risks/trade-offs, per-check reviews, and an AI-weighted recommendation;
- `assessment.aiContext`: counts of comments and attachments included in the context;
- `aiError`: a non-authoritative availability message when the model is unavailable.

For PDF attachments, the server downloads the Jira content through the authenticated Jira connection, sends it to Azure Document Intelligence `prebuilt-layout`, polls the analysis result, and passes extracted page text plus `jira-attachment:<id>` source references to the AI. Non-PDF attachments remain metadata-only for now. The AI must not infer evidence from a filename or failed extraction, change configured metrics, approve or reject an item, or claim a Jira mutation. A model or extraction failure leaves the deterministic evaluation available.

The UI presents the weighted decision and stage-specific AI response side by side, including a compact challenge/pros/cons view. Publishing writes the deterministic evaluation and, when present, the reviewed AI summary, challenge, benefits, risks, rationale, recommendation, and proposed comment into one Jira comment through the existing Fulcrum service-account path. Publishing is the human checkpoint; the AI route never advances the workflow.

This implements REQ-018 and REQ-027 while preserving the governance boundary in [agent-and-tool-contracts](agent-and-tool-contracts.md): AI drafts and challenges, while deterministic scoring, authorization, workflow, audit, and Jira mutation remain application responsibilities.
