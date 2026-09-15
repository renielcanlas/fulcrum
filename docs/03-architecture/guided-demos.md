# Guided demos

FULCRUM guided demos are data-driven walkthroughs for the synthetic `/demo` workbench. The catalogue lives in [`data/config/guided-demos.json`](../../data/config/guided-demos.json); the shared runner and targetable UI live in [`app/demo/page.js`](../../app/demo/page.js).

## Current catalogue

- **Welcome Tour** — introduces the board, metrics, initiative formulation, evidence lineage, controls, decisions, Jira integration, and Ciel.
- **Create the Golden Initiative** — walks through loading the synthetic Launch U.S.–Philippines Instant Remittance context, reviewing it, preparing the Jira story, and reaching the existing explicit creation confirmation.

The second demo is interactive. It does not create Jira work automatically and does not bypass the normal preparation, validation, server-side authorization, audit, or confirmation controls.

## Authoring a new demo

Add a catalogue entry with a unique `id`, `name`, `description`, `kind`, and ordered steps. Each step declares the `view` to show and the `target` to highlight. The target must be a stable `data-tour` attribute in that view. Set `interactive: true` only when the user should operate the highlighted control; the runner leaves the underlying UI usable and asks the user to select Next afterward.

Use the **Guided Demo Builder** agent at [`.github/agents/guided-demo-builder.agent.md`](../../.github/agents/guided-demo-builder.agent.md) for the repeatable implementation workflow. The focused contract tests are in [`test/guided-demos.test.js`](../../test/guided-demos.test.js).

Guided demos are presentation and training aids, not a second workflow engine. Navigation, authorization, validation, scoring, writes, and human decisions remain owned by the application.
