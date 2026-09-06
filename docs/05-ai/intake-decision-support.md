# Intake AI decision support

FULCRUM’s Intake evaluation has two deliberately separate layers:

1. The deterministic evaluator reads `data/config/intake-assessment.json` and owns the score, weights, threshold, and authoritative `recommendation`.
2. The bounded Azure AI decision-support task reviews the current Jira item, its recent comments, attachment inventory, and the deterministic result. It returns a reviewable proposal with a second recommendation, rationale, metric observations, and a draft Jira comment.

The configurable scoring file also defines the partial-credit factor, recommendation bands, and each checklist weight. The backend applies those weights to the AI’s per-check states (`pass`, `partial`, `fail`, or `uncertain`) and calculates an AI-weighted score. This makes the comparison visible without allowing the model to choose its own weights or thresholds.

The live route is `POST /api/jira/assessment/ai` with `{ "issueKey": "FCRM-80", "stage": "Intake" }`. It uses the configured Jira service-account connection for the read and returns:

- `assessment`: the deterministic Intake result;
- `assessment.weightedDecision`: the persisted score, maximum score, and weighted recommendation;
- `assessment.aiDecisionSupport`: the constrained AI proposal;
- `assessment.aiContext`: counts of comments and attachments included in the context;
- `aiError`: a non-authoritative availability message when the model is unavailable.

The AI prompt explicitly says that attachment filenames and metadata are not attachment contents. The model must not infer evidence from a filename, change configured metrics, approve or reject an item, or claim a Jira mutation. A model failure leaves the deterministic evaluation available.

The UI presents the weighted decision and AI response side by side. Publishing writes the deterministic assessment and, when present, the reviewed AI summary, rationale, recommendation, and proposed comment into one Jira comment through the existing Fulcrum service-account path. Publishing is the human checkpoint; the AI route never advances the workflow.

This implements REQ-018 and REQ-027 while preserving the governance boundary in [agent-and-tool-contracts](agent-and-tool-contracts.md): AI drafts and challenges, while deterministic scoring, authorization, workflow, audit, and Jira mutation remain application responsibilities.
