# FULCRUM agent guide

FULCRUM is a governed financial-crime risk assessment workbench. It prepares evidence and analysis; authorized humans decide. The repository is the source of truth.

## Before changing anything

Read [README.md](README.md), the relevant documents in `docs/`, applicable ADRs in `docs/11-decisions/`, and tests (when they exist). Find requirement IDs and preserve traceability. For regulatory claims, use only cited authoritative research; otherwise mark `RESEARCH REQUIRED`, `ASSUMPTION`, or `OPEN QUESTION`.

## Non-negotiable boundaries

- Deterministic software owns workflow, authorization, validation, scoring, thresholds, state, and audit.
- AI may retrieve, extract, classify, draft, challenge, and explain with evidence; it may not approve, reject, bypass controls, silently change rules, fabricate evidence, or mutate authoritative data without an authorized application command.
- Controls mitigate risk; they do not eliminate it. Keep inherent risk, control environment, residual risk, confidence, evidence quality, and completeness distinct.
- Synthetic data only for the hackathon. Do not add real customer or case data.
- Prefer a modular system over premature microservices. Do not add an agent or LLM where deterministic code is better.

## Working conventions

Use structured artifacts under `.ai/` for agent handoffs. Validate artifacts against schemas before consumption. Every material AI artifact records producer/version, model/provider, instruction version, sources, confidence, and validation status. Reference requirements in design, code, tests, and operational metrics.

Canonical context order: `AGENTS.md` → `docs/` → `.ai/` → source → tests → ADRs → evaluations. Tool-specific files are adapters only and must link back here.

## Definition of done

A change is not done until it is tested, documented, traceable to requirements, reviewed for security and human governance, and its handoff artifact is updated. Never make major architecture decisions silently; write an ADR.

See [docs/00-context/project-charter.md](docs/00-context/project-charter.md), [docs/05-ai/context-architecture.md](docs/05-ai/context-architecture.md), and [docs/01-requirements/requirements.md](docs/01-requirements/requirements.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
