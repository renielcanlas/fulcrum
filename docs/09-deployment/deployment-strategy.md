# Deployment strategy

Start with one Next.js web application deployed to Vercel, plus workers and managed relational/object/search services. Environments are local/demo/Preview/production-shaped; production access is out of scope until security and data approvals exist. See [Vercel deployment architecture](vercel-nextjs-deployment.md) and ADR-014. CI validates schemas, migrations, tests, dependency/security scans, configuration, traceability, and evaluation gates. Releases are immutable and versioned; rollback means redeploying a known-good application/configuration and preserving audit events.

Deployment validation is AI-assisted for review and release notes but deterministic checks are authoritative. Secrets come from a secret manager, never repository files.
