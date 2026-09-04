# FULCRUM Steps 7.5–10 completion report

Status: **READY WITH FIXES**

## Completed steps

| Step | Status | Result |
|---|---|---|
| 7.5 Model routing/token strategy | Complete | Fast, reasoning, Document Intelligence, and deterministic routes documented |
| 7.6 AI evaluation framework | Complete | Metrics, fixture labels, regression gates, and executable Golden evaluation added |
| 7.7 AI harness red-team | Complete | Injection, scope, tool-loop, malformed-output, outage, and autonomy risks reviewed; safe high-risk runtime issues fixed |
| 8 Implementation/Jira plan | Complete | Dependency-ordered solo-developer workstreams and acceptance criteria documented |
| 9 Development | Complete for current increment | Routing metadata, contract validation, bounded tool calls, and active-assessment enforcement implemented |
| 10 Testing/evaluation | Complete for current increment | 22 tests pass; production build passes; measured fixture evaluation passes |

## Material decisions

- Fast models handle bounded extraction, gap detection, and routine Q&A; reasoning models handle grounded synthesis; deterministic code handles authority-bearing work.
- The current AI boundary remains one bounded orchestrator with typed read tools, not a multi-agent runtime.
- Model output IDs and claims are untrusted until validated against allowed context.
- Tool calls are limited and must target the active assessment.
- Metrics distinguish measured, simulated, and not measured results.
- Live Jira, Azure, PostgreSQL, queues, and enterprise identity remain behind adapters or documented production evolution.
- The presentation increment now includes the landing page, judge-facing `/demo` workbench, and authenticated `/sandbox` Jira experimentation surface.
- The Jira sandbox supports fixed-project search and explicitly confirmed synthetic test-account scenarios; it is not FULCRUM assessment synchronization.

## What was implemented

- `src/ai/routing.js` with task-specific route selection.
- `src/ai/contract-validation.js` for reference, scope, and material-citation checks.
- `src/evaluation/golden-evaluation.js` for executable synthetic evaluation.
- Copilot protections for malformed arguments, active-assessment scope violations, and excessive tool calls.
- Contract/evaluation/security tests for the new protections.

## Validation results

```text
npm test: 22 passed, 0 failed
npm run build: passed
git diff --check: passed
AI execution envelope JSON parse: passed
Golden fixture evaluation: measured
  evidence coverage: 1.00
  control coverage: 1.00
  AI citation validity: 1.00
  deterministic score: 78 / HIGH
  analyst override preserved: true
  committee decision present: true
```

Not measured because external services or labeled datasets are not configured:

- provider token usage and latency;
- retrieval precision;
- fact precision/recall;
- real human acceptance rate.

## Current demo path

1. Start with `npm run dev`.
2. Select a synthetic persona.
3. Ask why residual risk is HIGH.
4. Inspect deterministic score and evidence trace.
5. Review the AI HIGH recommendation and Daniel Reyes's MEDIUM override.
6. Ask whether AI can approve; the governed Copilot refuses.
7. Review Helen Morgan's conditional committee decision and open conditions.

The current presentation also includes a public landing page and an authenticated Jira sandbox at `/sandbox`. The sandbox can connect through Atlassian OAuth, search the fixed synthetic `FCRM` project, and execute confirmed JSON scenarios against the dedicated test account. These operations are audit-recorded and isolated from FULCRUM assessment state. They do not demonstrate durable synchronization or production Jira write-back governance.

## Deferred scope

Physical PostgreSQL persistence, durable Jira OAuth token custody and sync/reconciliation, Azure adapters, Document Intelligence jobs, production RAG/embeddings, durable orchestration, full Step 6.5 scenario set, governed production write-back, autonomous decisions, enterprise identity, and production audit archival are intentionally deferred because they require external resources or are not necessary for the current hackathon vertical slice. The synthetic Jira sandbox and its controlled test-account mutations are implemented.

## Known risks

- In-memory repository and sessions are not reliable as durable Vercel production state.
- Current live provider path is OpenAI-compatible; Azure AI Foundry remains the documented target adapter.
- Retrieval and document extraction quality cannot be claimed until labeled corpora and services are configured.
- The FCRM UI demonstrates read-oriented Copilot/trace behavior more fully than mutation workflows; Jira mutation experiments are isolated to the sandbox.

## Judging rubric coverage

| Criterion | Evidence |
|---|---|
| AI harness/orchestration | Bounded orchestrator, typed tools, contracts, validation, retries |
| SDLC automation | Repository ADRs, implementation plan, tests, evaluation artifacts |
| Human governance | Analyst override, committee decision, AI refusal, workflow gates |
| Evaluation | Executable Golden metrics plus measured/not-measured distinction |
| Context engineering | Task-scoped context and citation/permission boundaries |
| Production readiness | Jira/FULCRUM authority boundary, Azure target, deployment limitations documented |
| Token efficiency | Routing, accepted-fact compression, top-K, caching, selective invalidation documented |
| Engineering judgment | No multi-agent swarm, no AI scoring, no Jira mirror, no unnecessary infrastructure |

## Readiness verdict

**READY WITH FIXES** for the hackathon development checkpoint. The current increment builds and tests successfully, but a reliable external deployment still requires durable state or a deliberately isolated demo environment, plus any desired Jira/Azure credentials.

## Next recommended step

Implement the compact PostgreSQL schema and fixture-backed seed/reset path, then add the remaining clarification and reassessment scenarios before connecting live Jira or Azure services.
