# CI/CD and database migrations

## Delivery flow

```text
Commit → Pull Request → tests/lint/type/build/security checks
       → Vercel Preview → review/smoke/evaluation
       → merge main → Vercel Demo/Production deployment
```

GitHub is the source of truth and Vercel handles the lightweight deployment path. Required checks should include `npm test`, `npm run build`, schema validation, dependency/security checks, and authorization/AI regression suites as they are added.

## Migrations

When persistence is introduced, every schema change is a versioned migration created and reviewed with the selected ORM or SQL migration tool. Apply migrations in deployment order; use forward-compatible changes and forward fixes for the hackathon. A migration must not silently rewrite audit history or historical assessment versions. Migration application should be a controlled deployment step, not a manual production database edit.
