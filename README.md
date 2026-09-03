# FULCRUM

### Governed financial-crime risk assessment, prepared by AI and decided by humans.

FULCRUM is a standalone risk assessment workbench for new products and material changes across banking, payments, commercial banking, and wealth management.

It turns a fragmented process of email, Word, Excel, SharePoint, and manually collected evidence into one traceable journey:

```text
INTAKE → UNDERSTAND → EXTRACT → RESEARCH → DECOMPOSE RISK → SCORE
       → ANALYST REVIEW → CHALLENGE → COMMITTEE DECISION → AUDIT → LEARN
```

> **The system prepares. Humans decide.**

FULCRUM does not automatically approve or reject changes. AI retrieves, extracts, explains, compares, drafts, and challenges. Deterministic services calculate governed outputs. Authorized FCRM analysts and Risk Committee members retain decision authority.

## Why FULCRUM

Financial-crime risk assessments can take 15–20 business days and can be difficult to reconstruct when an examiner asks why a rating was assigned. FULCRUM is designed to make an assessment decision-ready in approximately two days while preserving:

- the change request and structured business context
- evidence and source citations
- applicable policy and regulatory references
- risk factors, controls, and control effectiveness
- deterministic scoring inputs, thresholds, and calculation traces
- AI observations, uncertainty, and limitations
- analyst reasoning and human overrides
- committee rationale and final decision
- an immutable, examiner-ready audit trail

## What makes this AI-native

FULCRUM is not a generic chatbot or an LLM wrapper. The embedded **FULCRUM Copilot** operates inside the assessment workspace and uses governed backend tools to answer questions such as:

- “Why is residual AML risk High?”
- “Which evidence supports the geography risk?”
- “What did the analyst override?”
- “What changed since the prior assessment?”
- “Which implementation conditions are still open in Jira?”
- “What is still missing before committee review?”

The Copilot uses the active assessment context, permission-checked FULCRUM records, and explicitly linked Jira initiative context. It does not receive the entire assessment in every prompt, does not access the database directly, and does not treat conversation history as authoritative.

## How we used AI to build this project

AI is part of both the FULCRUM product and its development lifecycle. We used a [ChatGPT Project for general research and discovery](https://chatgpt.com/g/g-p-6a986f8905ec8191af3c67f1f4f241c7-geniushacks/project), Codex for repository creation, architecture, requirements, ADRs, implementation, and testing, and the OpenAI API for the runtime Copilot’s governed reasoning, structured tool use, and chatbot behavior.

For technical accuracy, the current work is OpenAI API model integration and FCRM behavior/orchestration design—not a claim that we trained a foundation model. FULCRUM’s authoritative decision logic remains deterministic code; the model explains and assists around those calculations, while humans decide. See [AI usage and hackathon methodology](docs/05-ai/ai-usage-and-hackathon-methodology.md) for the full approach and planned next steps.

Every material answer distinguishes:

| Label | Meaning |
|---|---|
| `FACT` | Retrieved authoritative business or assessment data |
| `SYSTEM CALCULATION` | Deterministic score, threshold, rule, or workflow result |
| `AI OBSERVATION` | Model-generated interpretation or possible gap |
| `HUMAN JUDGMENT` | Analyst or committee decision, rationale, or override |
| `UNKNOWN` | Information that is missing, stale, contradictory, or unauthorized |

## Architecture at a glance

```text
┌─────────────────────────────────────────────────────────────┐
│ FULCRUM Web App                                             │
│ Dashboard · Assessment Workspace · Committee Workspace      │
│                         Embedded Copilot                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     FULCRUM AI Gateway
                               │
                    Governed Copilot Orchestrator
                     ┌─────────┼─────────┐
                     │         │         │
              Context assembler  Tools   Guardrails
                     │         │         │
          FULCRUM records +     │   Authorization + audit
          linked Jira context   │
                               │
                    OpenAI provider adapter
                               │
                     OpenAI Responses API

        Tools → deterministic risk engine
              → FCRM knowledge retrieval
              → Jira backend adapter → Jira Cloud REST API
              → audit service
```

The initial implementation intentionally uses one governed Copilot orchestrator rather than many autonomous agents. Specialized agents can be added when there is a clear responsibility, context, security, evaluation, or model-selection reason.

## Deterministic versus AI responsibilities

| Deterministic software | AI assistance | Humans |
|---|---|---|
| Workflow and state | Retrieval and interpretation | Validate material evidence |
| Authorization and RBAC | Extraction and normalization | Challenge assumptions |
| Risk scoring and thresholds | Gap and contradiction detection | Override with rationale |
| Control mitigation rules | Assessment drafting | Approve, reject, defer |
| Required approvals | Committee briefing | Set conditions |
| Audit and provenance | Grounded conversational Q&A | Own governance decisions |

The model cannot approve, reject, vote, change a rating, change scoring rules, bypass authorization, broaden Jira access, or directly mutate authoritative state.

## Jira integration

Jira is FULCRUM’s integrated work-management context—not its risk system of record.

The planned integration uses server-side Atlassian OAuth 2.0 3LO with narrow scopes. The browser never receives Jira or OpenAI credentials. FULCRUM retrieves only explicitly linked, permission-checked Jira initiatives and stores a normalized projection with provenance and freshness metadata.

```text
User → FULCRUM backend → JiraAdapter → Jira Cloud REST API
                         ↑
                 authorization + audit
```

Jira webhooks trigger reconciliation; they do not directly change FULCRUM risk state. See [Jira OAuth integration](docs/03-architecture/jira-oauth-integration.md) and [ADR-002](docs/11-decisions/ADR-002-jira-oauth-integration.md).

## Current demo

The repository currently contains the architecture foundation and the first executable Copilot increment:

- embedded chat page for an assessment workspace
- active assessment context (`FA-2026-00124`)
- typed backend tools over a demo governed repository
- FCRM Analyst and Product Owner authorization checks
- deterministic demo risk values and linked Jira work items
- OpenAI provider adapter with safe no-key demo mode
- AI interaction audit records
- tests proving tool execution, access isolation, and decision non-mutation

The broader assessment application, persistent datastore, live Jira OAuth connection, and production knowledge corpus are staged for subsequent increments.

## Run it locally

Requirements: Node.js 20 or newer.

```bash
npm test
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Without an API key, the app runs in safe demo mode. To use the OpenAI adapter:

```bash
OPENAI_API_KEY=your_key npm start
```

Optional configuration:

```bash
OPENAI_MODEL=gpt-5 PORT=3000 npm start
```

Credentials are read by the backend only and must never be committed.

## Judge walkthrough

1. Open the Assessment Workspace and observe the active assessment context.
2. Ask: **“Why is AML residual risk High?”**
3. Inspect the tool-backed answer and distinguish system calculations from AI explanation.
4. Ask: **“Which Jira work items are still open?”**
5. Ask: **“Should we approve this product?”** and observe the human-decision refusal.
6. Review the code and tests showing authorization, audit, and non-mutation boundaries.
7. Follow the architecture and ADR links below to see how the demo scales into the full workbench.

## How this maps to the judging criteria

| Criterion | Evidence in this repository |
|---|---|
| AI harness and orchestration | [AI orchestration](docs/architecture/ai-orchestration.md), [Copilot design](docs/05-ai/fcrm-copilot-and-jira-assistant.md) |
| AI across the SDLC | [ADR-001: AI-native SDLC](docs/11-decisions/ADR-001-ai-native-sdlc.md) |
| Human-in-the-loop governance | [Human-in-the-loop and audit](docs/07-governance/human-in-the-loop-and-audit.md) |
| Evaluation framework | [Testing and evaluation](docs/08-testing/testing-and-evaluation.md), [golden dataset plan](docs/08-testing/golden-dataset-plan.md) |
| Context engineering | [Context architecture](docs/05-ai/context-architecture.md) |
| Production readiness | [Security model](docs/07-governance/security-model.md), [deployment strategy](docs/09-deployment/deployment-strategy.md), [operations strategy](docs/10-operations/operations-strategy.md) |
| Token efficiency | [Token-efficiency strategy](docs/05-ai/token-efficiency.md) |
| Engineering judgment | [Architecture principles](docs/03-architecture/architecture-principles.md), [ADR-000](docs/11-decisions/ADR-000-initial-architecture.md) |

## Project map

Start here:

- [AGENTS.md](AGENTS.md) — canonical engineering and AI-agent instructions
- [Project charter](docs/00-context/project-charter.md) — problem, scope, principles, and outcomes
- [Requirements](docs/01-requirements/requirements.md) — traceable requirements `REQ-001` through `REQ-027`
- [Architecture principles](docs/03-architecture/architecture-principles.md)
- [Conceptual architecture](docs/03-architecture/conceptual-architecture.md)
- [Conceptual data model](docs/03-architecture/conceptual-data-model.md)
- [Workflow architecture](docs/03-architecture/workflow-architecture.md)
- [Workflow transition table](docs/03-architecture/workflow-transition-table.md)
- [Workflow self-review](docs/03-architecture/workflow-self-review.md)
- [FCRM Copilot and Jira Assistant](docs/05-ai/fcrm-copilot-and-jira-assistant.md)
- [AI boundaries](.ai/policies/ai-boundaries.md)
- [Security & Governance Architecture](docs/07-governance/security-governance-architecture.md)
- [Identity and RBAC](docs/07-governance/identity-and-rbac.md)
- [AI security and provenance](docs/07-governance/ai-security-and-provenance.md)
- [Audit and security events](docs/07-governance/audit-security-events.md)
- [Architecture decision records](docs/11-decisions/README.md)
- [Jira-ready roadmap](docs/01-requirements/jira-roadmap.md)

## Delivery roadmap

1. **Copilot foundation — current:** embedded UI, backend orchestration, typed read tools, demo context, authorization, and audit.
2. **Workflow foundation — current:** centralized state machine, explicit human gates, immutable event intent, conditions, and reassessment/versioning paths.
3. **Governed knowledge — next:** synthetic policy corpus, metadata-filtered hybrid retrieval, citations, and evaluation fixtures.
4. **Assessment workbench:** persistent domain model, evidence ingestion, deterministic scoring, analyst review, overrides, and committee workflow.
5. **Jira Cloud connection:** OAuth 2.0 3LO, token vault, linked-initiative sync, reconciliation, and integration observability.
6. **Production-shaped delivery:** deployment controls, operational runbooks, security testing, regression gates, and model/provider evaluation.

## Design decisions and guardrails

FULCRUM is deliberately not:

- an autonomous risk decision-maker
- a generic chatbot over unrestricted enterprise data
- a Jira-native bot that treats Jira status as risk authority
- an opaque LLM-generated risk score
- a collection of agents that share private conversational memory

Major decisions are recorded as ADRs, structured artifacts are exchanged through `.ai/`, and unknown regulatory or product assumptions are explicitly marked rather than invented.

## License and status

Hackathon project. All demo data is synthetic. Regulatory mappings, internal policy content, production data handling, and enterprise integration configuration require review by qualified FCRM, security, legal, and platform owners before production use.
