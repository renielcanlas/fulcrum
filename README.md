# FULCRUM

### Governed financial-crime risk assessment, prepared by AI and decided by humans.

FULCRUM is a financial-crime decision intelligence workbench for Jira-backed business initiatives. Jira remains authoritative for initiative and collaboration data; FULCRUM is authoritative for the governed assessment, risk methodology, human decisions, conditions, and audit lineage. Azure AI Foundry is the primary AI platform direction, with Azure AI Document Intelligence providing document extraction and evidence provenance behind the AI Gateway.

It turns a fragmented process of email, Word, Excel, SharePoint, and manually collected evidence into one traceable journey:

```text
INTAKE → UNDERSTAND → EXTRACT → RESEARCH → DECOMPOSE RISK → SCORE
       → ANALYST REVIEW → CHALLENGE → COMMITTEE DECISION → AUDIT → LEARN
```

> **The system prepares. Humans decide.**

FULCRUM does not automatically approve or reject changes. AI retrieves, extracts, explains, compares, drafts, and challenges. Deterministic services calculate governed outputs. Authorized FCRM analysts and Risk Committee members retain decision authority.

This is a Next.js App Router application designed for deployment to Vercel. The current increment includes a polished landing page, a judge-facing FCRM demo workbench, a governed Copilot foundation, and a separate sandbox with Jira experiments, AI scenario generation, and Ciel chat. Durable production persistence and full enterprise synchronization remain on the roadmap.

## The canonical demo

The first end-to-end scenario is **Launch U.S.–Philippines Instant Remittance**. Maya Chen submits the synthetic initiative, Daniel Reyes reviews the FCRM findings and overrides one AI recommendation with a recorded rationale, and Helen Morgan approves the bounded launch with conditions. The complete facts, evidence, controls, risk domains, workflow timing, Jira links, AI observations, override, and decision are in the [Golden Initiative demo](docs/04-domain/golden-initiative-demo.md) and [canonical fixture](data/demo/golden-initiative.json).

To run the presentation flow, start the app with `npm run dev`, open `http://localhost:3000`, select a synthetic persona, and ask **Ciel**, FULCRUM AI Assistant, about residual risk, evidence, missing information, or open Jira conditions. Ciel can explain and draft; it cannot approve or reject.

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

FULCRUM is not a generic chatbot or an LLM wrapper. The embedded **Ciel** FULCRUM AI Assistant operates inside the assessment workspace and uses governed backend tools to answer questions such as:

- “Why is residual AML risk High?”
- “Which evidence supports the geography risk?”
- “What did the analyst override?”
- “What changed since the prior assessment?”
- “Which implementation conditions are still open in Jira?”
- “What is still missing before committee review?”

Ciel uses the active assessment context, permission-checked FULCRUM records, and explicitly linked Jira initiative context. It does not receive the entire assessment in every prompt, does not access the database directly, and does not treat conversation history as authoritative.

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

Jira is the system of record for the underlying business initiative and collaboration artifacts. FULCRUM references that context and remains the system of record for the FCRM assessment and decision lineage.

The implemented demo connection uses server-side Atlassian OAuth 2.0 3LO. The browser never receives Jira or AI-provider credentials. The current sandbox can search the configured synthetic `FCRM` project and run explicitly confirmed JSON scenarios against that project. This proves the connection and adapter boundary; it is not yet the governed linked-initiative synchronization path.

```text
User → FULCRUM backend → JiraAdapter → Jira Cloud REST API
                         ↑
                 authorization + audit
```

Jira webhooks trigger reconciliation; they do not directly change FULCRUM risk state. See [Jira OAuth integration](docs/03-architecture/jira-oauth-integration.md) and [ADR-002](docs/11-decisions/ADR-002-jira-oauth-integration.md).

See the [Jira sandbox guide](docs/03-architecture/jira-sandbox.md) for the available experiments, route boundary, synthetic-data rules, and current limitations. Ciel can read linked live `FCRM-*` Jira work items and, after explicit confirmation, improve only a story description through the server-side service-account adapter.

## Current demo

The repository currently contains the architecture foundation and the first executable Copilot increment:

- public product landing page at `/`
- judge-facing FCRM workbench at `/demo`
- embedded chat page for an assessment workspace
- Jira experimentation sandbox at `/sandbox`
- live Jira OAuth connection and status flow when Atlassian environment variables are configured
- fixed-project Jira search and sequential JSON scenario automation for synthetic work items
- first-stage Intake assessment with configurable weighted checks, Jira-only publication, and explicit next-stage transition confirmation
- active assessment context (`FA-2026-00124`)
- typed backend tools over a demo governed repository
- FCRM Analyst and Product Owner authorization checks
- deterministic demo risk values and linked Jira work items
- deterministic score calculation and inspectable Risk → Fact → Evidence → Control → Decision trace
- read-only decision trace at `/api/initiatives/INIT-2026-0007/trace`
- Provider-neutral AI Gateway with safe no-key demo mode; Azure AI Foundry is the primary platform direction
- Azure AI Document Intelligence planned for document extraction and evidence provenance
- AI interaction audit records
- tests proving tool execution, access isolation, and decision non-mutation

The broader assessment workflow, persistent datastore, durable Jira connection/sync services, and production knowledge corpus are staged for subsequent increments.

## Run it locally

Requirements: Node.js 20 or newer.

```bash
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run build && npm start` to run the production build locally. See the [Vercel deployment architecture](docs/09-deployment/vercel-nextjs-deployment.md) for the deployment path.

Without Azure configuration, the app runs in safe demo mode. The server automatically loads a local `.env` file if present. The planned Azure configuration is server-only and deployment-specific:

```bash
AZURE_AI_FOUNDRY_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_AI_FOUNDRY_API_VERSION=your-approved-api-version
AZURE_AI_FOUNDRY_FAST_DEPLOYMENT=your-fast-deployment
AZURE_AI_FOUNDRY_REASONING_DEPLOYMENT=your-reasoning-deployment
AZURE_AI_FOUNDRY_EMBEDDING_DEPLOYMENT=your-embedding-deployment
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-document-resource.cognitiveservices.azure.com/
```

Then run `npm start`. `.env` is ignored by Git; never commit real credentials.

Optional configuration:

```bash
AZURE_AI_FOUNDRY_FAST_DEPLOYMENT=your-fast-deployment PORT=3000 npm start
```

Credentials are read by the backend only and must never be committed.

For the Jira sandbox, configure the server-side Atlassian service-account OAuth values in `.env`:

```bash
ATLASSIAN_CLIENT_ID=your-atlassian-client-id
ATLASSIAN_CLIENT_SECRET=your-atlassian-client-secret
JIRA_CLOUD_ID=your-jira-cloud-id
JIRA_SITE_URL=https://your-site.atlassian.net
```

The client ID and secret are used server-side with Atlassian's service-account client-credentials flow, so the sandbox does not require interactive Jira reauthentication. The Cloud ID is the value from `https://your-site.atlassian.net/_edge/tenant_info`; it is not the organization ID. The sandbox project is fixed to `FCRM` by `data/config/jira-integration.json`.

## Jira sandbox walkthrough

1. Start the app with `npm run dev`.
2. Open `/sandbox` directly, or use the landing-page link. No FULCRUM persona login is required.
3. Use **Jira search** to query the fixed `FCRM` project.
4. Use **Scenario automator** to inspect a checked-in scenario, import/paste custom JSON, or choose **Custom scenario** to ask Azure AI for a synthetic draft.
5. Review the initial draft, validation indicators, and bounded AI refinement before confirming execution.
6. Use only the dedicated synthetic Jira account. The cleanup scenario remains manual and permanently deletes all work items returned from the `FCRM` project search.

The sandbox authenticates to Jira with the server-side service account and does not create, approve, reject, or otherwise mutate FULCRUM assessment state.

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
- [Product direction](docs/00-context/product-direction.md) — Initiative, differentiation, and product boundary
- [Requirements](docs/01-requirements/requirements.md) — traceable requirements `REQ-001` through `REQ-029`
- [Architecture principles](docs/03-architecture/architecture-principles.md)
- [Accepted architecture baseline](docs/03-architecture/architecture-baseline.md)
- [Architecture decision dependency map](docs/03-architecture/architecture-decision-dependency-map.md)
- [Judge-facing decision summary](docs/03-architecture/judge-facing-decision-summary.md)
- [Initiative domain decision](docs/11-decisions/ADR-024-initiative-as-primary-domain-object.md)
- [Cross-architecture consistency review](docs/03-architecture/architecture-consistency-review.md)
- [Conceptual architecture](docs/03-architecture/conceptual-architecture.md)
- [Conceptual data model](docs/03-architecture/conceptual-data-model.md)
- [Golden Initiative demo scenario](docs/04-domain/golden-initiative-demo.md) — canonical synthetic end-to-end dataset
- [Golden Initiative API/data contracts](docs/04-domain/golden-initiative-contracts.md)
- [Domain model and entity relationships](docs/04-domain/domain-model-and-entity-relationships.md)
- [Evidence and decision lineage](docs/04-domain/evidence-and-decision-lineage.md)
- [Versioning and configuration model](docs/04-domain/versioning-and-configuration-model.md)
- [Data model resolution](docs/04-domain/data-model-resolution.md) — approved decisions before physical schema design
- [Canonical entity glossary](docs/04-domain/canonical-entity-glossary.md)
- [Physical schema scope](docs/04-domain/physical-schema-scope.md)
- [Golden fixture mapping](docs/04-domain/golden-fixture-mapping.md)
- [Jira/FULCRUM data authority ADR](docs/11-decisions/ADR-028-jira-fulcrum-data-authority.md)
- [Jira sandbox and experimentation surface](docs/03-architecture/jira-sandbox.md)
- [Jira sandbox user guide](docs/03-architecture/jira-sandbox-user-guide.md) — AI scenario builder, validation, execution, and cleanup
- [Data model resolution ADR](docs/11-decisions/ADR-029-data-model-resolution.md)
- [Canonical golden fixture](data/demo/golden-initiative.json)
- [Workflow architecture](docs/03-architecture/workflow-architecture.md)
- [Workflow transition table](docs/03-architecture/workflow-transition-table.md)
- [Workflow self-review](docs/03-architecture/workflow-self-review.md)
- [FCRM Copilot and Jira Assistant](docs/05-ai/fcrm-copilot-and-jira-assistant.md)
- [AI capability map](docs/05-ai/ai-capability-map.md) — Step 7.1 AI/deterministic/human boundary
- [Agent and orchestration design](docs/05-ai/agent-and-orchestration-design.md) — Step 7.2 bounded coordination and human gates
- [Context engineering and RAG design](docs/05-ai/context-engineering-and-rag-design.md) — Step 7.3 scoped context, retrieval, and grounding
- [Agent and tool contracts](docs/05-ai/agent-and-tool-contracts.md) — Step 7.4 structured AI/task/tool boundaries
- [Model routing and token strategy](docs/05-ai/model-routing-and-token-strategy.md) — Step 7.5 efficient model use
- [AI evaluation framework](docs/08-testing/ai-evaluation-framework.md) — Step 7.6 measurable quality and regression gates
- [AI harness red-team](docs/07-governance/ai-harness-red-team.md) — Step 7.7 adversarial review and mitigations
- [Implementation and Jira execution plan](docs/08-testing/implementation-and-jira-execution-plan.md) — Step 8 delivery sequence
- [Steps 7.5–10 completion report](docs/10-operations/step-10-completion-report.md) — implementation, tests, evaluation, and current readiness
- [Azure AI Foundry and Document Intelligence architecture](docs/05-ai/azure-ai-foundry-and-document-intelligence.md)
- [AI boundaries](.ai/policies/ai-boundaries.md)
- [Security & Governance Architecture](docs/07-governance/security-governance-architecture.md)
- [Identity and RBAC](docs/07-governance/identity-and-rbac.md)
- [AI security and provenance](docs/07-governance/ai-security-and-provenance.md)
- [Audit and security events](docs/07-governance/audit-security-events.md)
- [Vercel deployment architecture](docs/09-deployment/vercel-nextjs-deployment.md)
- [Deployment topology](docs/09-deployment/deployment-topology.md)
- [Environment model](docs/09-deployment/environment-model.md)
- [CI/CD and migrations](docs/09-deployment/ci-cd-and-migrations.md)
- [Demo versus production deployment matrix](docs/09-deployment/demo-production-matrix.md)
- [Architecture decision records](docs/11-decisions/README.md)
- [ADR-026: Azure AI Foundry and Document Intelligence](docs/11-decisions/ADR-026-azure-ai-foundry-and-document-intelligence.md)
- [Jira-ready roadmap](docs/01-requirements/jira-roadmap.md)

## Delivery roadmap

1. **Presentation foundation — current:** public landing page, judge-facing FCRM workbench, synthetic persona entry, decision trace, and embedded Copilot.
2. **Copilot foundation — current:** backend orchestration, typed read tools, demo context, authorization, and audit.
3. **Jira experimentation — current:** server-side OAuth connection, fixed-project search, and explicitly confirmed JSON scenario automation for synthetic work items.
4. **Workflow foundation — current:** centralized state machine, explicit human gates, immutable event intent, conditions, and reassessment/versioning paths.
5. **Deployment foundation — current:** Next.js App Router, Vercel-compatible route handlers, build scripts, and environment configuration. Durable persistence and Vercel Preview deployment remain next.
6. **Governed knowledge:** synthetic policy corpus, metadata-filtered hybrid retrieval, citations, and evaluation fixtures.
7. **Assessment workbench:** persistent domain model, evidence ingestion, deterministic scoring, analyst review, overrides, and committee workflow.
8. **Governed Jira synchronization:** token vault, explicit linked-initiative selection, read reconciliation, freshness/provenance, and integration observability.
9. **Production-shaped delivery:** deployment controls, operational runbooks, security testing, regression gates, and model/provider evaluation.

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
