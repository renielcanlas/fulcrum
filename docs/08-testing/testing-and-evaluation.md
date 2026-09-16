# Testing strategy

Tests map to requirement IDs. Use unit/property tests for deterministic scoring, workflow, authorization, validation, and audit; integration tests for storage, retrieval, queues, and adapters; contract tests for schemas/providers; end-to-end tests for the full journey; security tests for threats in the security model.

AI evaluation uses synthetic golden cases with expected facts/source spans, policy citations, risk observations, Jira-context permissions, freshness, and known abstentions. Track extraction precision/recall, retrieval precision, citation correctness, groundedness, hallucination/refusal rate, schema validity, consistency, Jira access isolation, context freshness, latency, token/cost, and human acceptance/override rates. Every prompt/model/config change runs regression and adversarial suites; failures block promotion according to a yet-to-be-approved release policy.

## Browser UAT

The repository also includes a user-invocable [FULCRUM Test Generator](../../.github/agents/test-generator.agent.md). Give it a feature, page, regression, role, or acceptance criterion. It inspects the relevant requirements, source, routes, fixtures, and existing tests, then recommends or writes the narrowest suitable unit and/or Playwright coverage. Its versioned contract is `.ai/agents/test-generator.v1.yaml`.

The generator is deliberately bounded: it uses synthetic fixtures, does not contact live Jira/Azure/Neon services by default, must not weaken authorization or human gates, and treats AI output as non-authoritative. It reports a coverage matrix and exact validation counts.

The repository includes a Playwright suite under `e2e/uat.spec.js`. Run it with
`npm run test:uat`. The suite starts an isolated local Next.js server and
intercepts external/backend API responses with synthetic fixtures, so it does
not require live Jira, Neon, or Azure credentials. It validates the rendered
user journeys for login, role access, Help Center content, evaluation loading,
and reassignment before stage transition. Playwright captures a full-page
screenshot, video, trace, and JSON metadata attachment for every test,
including passing tests, under `test-results/`.

Open the HTML evidence bundle with `npx playwright show-report`. A report entry
links to the screenshot, video, trace, and metadata for that UAT journey. The
fixtures are synthetic and API routes are intercepted, so this evidence proves
the browser workflow and UI contract; it is not evidence that a live Jira or
Azure service accepted a write.
