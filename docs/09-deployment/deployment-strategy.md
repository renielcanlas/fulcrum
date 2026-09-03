# Deployment strategy

Start with one deployable modular application plus worker and managed relational/object/search services. Environments are local/demo/staging/production-shaped; production access is out of scope until security and data approvals exist. CI validates schemas, migrations, tests, dependency/security scans, configuration, traceability, and evaluation gates. Releases are immutable and versioned; rollback means redeploying a known-good application/configuration and preserving audit events.

Deployment validation is AI-assisted for review and release notes but deterministic checks are authoritative. Secrets come from a secret manager, never repository files.
