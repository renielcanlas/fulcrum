# Testing strategy

Tests map to requirement IDs. Use unit/property tests for deterministic scoring, workflow, authorization, validation, and audit; integration tests for storage, retrieval, queues, and adapters; contract tests for schemas/providers; end-to-end tests for the full journey; security tests for threats in the security model.

AI evaluation uses synthetic golden cases with expected facts/source spans, policy citations, risk observations, Jira-context permissions, freshness, and known abstentions. Track extraction precision/recall, retrieval precision, citation correctness, groundedness, hallucination/refusal rate, schema validity, consistency, Jira access isolation, context freshness, latency, token/cost, and human acceptance/override rates. Every prompt/model/config change runs regression and adversarial suites; failures block promotion according to a yet-to-be-approved release policy.

## Browser UAT

The repository includes a Playwright suite under `e2e/uat.spec.js`. Run it with
`npm run test:uat`. The suite starts an isolated local Next.js server and
intercepts external/backend API responses with synthetic fixtures, so it does
not require live Jira, Neon, or Azure credentials. It validates the rendered
user journeys for login, role access, Help Center content, evaluation loading,
and reassignment before stage transition. Playwright retains screenshots,
video, and traces for failed tests in `test-results/`.
