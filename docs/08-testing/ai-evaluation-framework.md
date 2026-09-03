# FULCRUM AI evaluation framework

Status: **Step 7.6 — initial executable framework**.

All evaluation data is synthetic. Results are classified as `MEASURED`, `SIMULATED`, or `NOT_MEASURED`; no unavailable provider metric is fabricated.

## Evaluation dimensions

| Capability | Primary metrics | Initial acceptance signal |
|---|---|---|
| Fact extraction | field precision/recall, evidence attribution accuracy, schema validity, analyst acceptance/edit/rejection | 100% required source IDs valid; target quality thresholds set per fixture |
| Retrieval/RAG | relevance@K, citation correctness, citation coverage, miss/false-positive rate | Material synthesis has valid citations or abstains |
| Risk analysis | grounded recommendation rate, unsupported claim rate, missed-factor rate, analyst acceptance | No unsupported material claim; human review required |
| Assessment drafting | factual grounding, citation coverage, completeness, analyst edit level | All material claims trace to accepted facts, score, or evidence |
| Conversational assistant | answer correctness, grounding, authorization correctness, refusal correctness | Prohibited decisions/actions are refused and authorized sources are cited |
| Orchestration | task completion, schema validity, retry rate, tool failures, human escalation | Invalid artifacts never reach downstream tasks |
| Efficiency | input/output tokens, latency, calls/assessment, cache hit rate | No unbounded loops; high-token tasks are visible |

## Synthetic evaluation cases

The Golden Initiative is the baseline case and includes expected risk domains, evidence links, deterministic score 78/HIGH, AI HIGH recommendation, Daniel Reyes's MEDIUM override, and Helen Morgan's conditional decision. Additional Step 6.5 scenarios should add straightforward approval, clarification, and v2 reassessment cases.

Each case should define:

```text
caseId
inputReferences
expectedFacts and source spans
expected citations
expected risk observations
expected abstentions/refusals
allowed tools
human disposition fixture
```

## Measured versus simulated

- Current deterministic scoring and fixture lineage: `MEASURED` by automated tests.
- Provider token usage/latency: `MEASURED` only on a real provider response; otherwise `NOT_MEASURED`.
- Full extraction/retrieval precision and recall: `NOT_MEASURED` until labeled multi-case fixtures exist.
- Contract, authorization, refusal, and non-mutation behavior: `MEASURED` by automated tests.
- Human acceptance/override rates: `SIMULATED` for seeded fixtures until real reviewers use the system.

## Regression gates

Every task-contract, prompt, model, retrieval-config, or context-builder change should run:

- schema and reference validation;
- grounding/citation checks;
- authorization isolation tests;
- prohibited-action/refusal tests;
- Golden Initiative deterministic score and trace tests;
- token/latency telemetry assertions where available.

Material regressions block promotion until an analyst or architecture owner reviews them.

## Feedback loop

Human dispositions become labels for future evaluation. Accepted, edited, rejected, overridden, stale, and escalated outputs are retained with task/model/context versions. Metrics are compared by task and route, not collapsed into one misleading AI score.
