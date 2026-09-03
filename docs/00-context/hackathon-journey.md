# My Hackathon Journey

FULCRUM evolved from a broad FCRM problem statement into a judge-ready, synthetic end-to-end experience. This record summarizes the work behind the demo and links the journey to the repository artifacts.

## Stage 01 — Requirements

We translated the initial brief into a working specification: the problem statement, personas, judging goals, risk domains, human decision boundaries, and the Golden Initiative scenario. Research filled gaps without inventing regulatory requirements.

See [requirements](../01-requirements/requirements.md), [personas and journeys](personas-and-journeys.md), and the [Golden Initiative](../04-domain/golden-initiative-demo.md).

## Stage 02 — Design

We designed the application boundary, Jira relationship, evidence lineage, versioning model, workflow gates, risk scoring, UX direction, and AI governance. The central design decision was simple: AI assists; deterministic services and people remain accountable.

See the [architecture baseline](../03-architecture/architecture-baseline.md), [architecture principles](../03-architecture/architecture-principles.md), and [AI capability map](../05-ai/ai-capability-map.md).

## Stage 03 — Development

We built the Next.js and Vercel foundation, synthetic domain data, the governed Ciel copilot, typed read tools, audit seams, initiative detail screens, Jira integration guidance, and the interactive demo flow.

See the [deployment architecture](../09-deployment/vercel-nextjs-deployment.md), [AI orchestration](../05-ai/fcrm-copilot-and-jira-assistant.md), and [Golden Initiative fixture](../../data/demo/golden-initiative.json).

## Stage 04 — Testing

We added regression coverage for deterministic scoring, evidence lineage, authorization, workflow integrity, human-only decisions, AI boundaries, session behavior, and the synthetic Golden Initiative. The current suite is intentionally honest about what remains an adapter-level or production concern.

See the [AI evaluation framework](../08-testing/ai-evaluation-framework.md) and [testing and evaluation plan](../08-testing/testing-and-evaluation.md).

## Stage 05 — Deployment

We selected Next.js on Vercel as the practical hackathon deployment path, while keeping AI, Jira, persistence, and document processing behind replaceable server-side boundaries. The plan separates demo reliability from the managed services required for production.

See the [Vercel deployment guide](../09-deployment/vercel-nextjs-deployment.md) and [deployment strategy](../09-deployment/deployment-strategy.md).

## Stage 06 — Operations

We documented the operating model for audit, observability, failure handling, model evaluation, token usage, Jira freshness, and continuous improvement. The next evolution is to replace in-memory demo seams with durable services and production controls.

See the [operations strategy](../10-operations/operations-strategy.md), [failure and observability plan](../09-deployment/failure-observability-scaling.md), and [AI usage methodology](../05-ai/ai-usage-and-hackathon-methodology.md).

## Future improvements — Jira Forge companion

After the hackathon, FULCRUM could add a thin Atlassian Forge companion for teams that work primarily in Jira. The companion could surface a linked FULCRUM assessment, provide an **Open in FULCRUM** entry point, show assessment status and conditions, and support explicitly authorized requests such as starting an assessment.

Forge would be an adoption and workflow layer, not a replacement for the planned server-side Jira Cloud OAuth 2.0 3LO adapter. FULCRUM would remain authoritative for risk scoring, assessment workflow, human decisions, conditions, and audit lineage. The Forge app would not store authoritative risk state or make approval decisions; requests would call FULCRUM APIs, which would enforce application authorization and audit the resulting action.

This is a post-hackathon option, to prioritize after the live Jira adapter, durable persistence, and production identity boundaries. Its value depends on whether FULCRUM users need to discover and act on assessments from inside Jira.

## What the journey demonstrates

The hackathon outcome is not only a UI mockup. It is a connected decision path: a Product Owner submits an initiative, FULCRUM assembles governed context, Ciel assists the analyst, deterministic services calculate risk, a human analyst can override with rationale, and the committee makes the final decision with conditions and lineage preserved.
