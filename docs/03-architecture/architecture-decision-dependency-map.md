# Architecture decision dependency map

```text
Human accountability
├── Human review gates
├── Human-only consequential decisions
├── Override governance
└── Immutable decision history

Evidence traceability
├── Evidence lineage
├── AI provenance
├── Assessment versioning
└── Versioned risk configuration

AI governance
├── Bounded capabilities
├── Evidence-grounded retrieval
├── Scoped context engineering
├── Human review
└── AI evaluation

System integrity
├── FULCRUM system of record
├── Explicit workflow state machine
├── Managed PostgreSQL persistence
└── Event-driven integrations

Delivery integrity
├── Next.js/Vercel web tier
├── GitHub/Vercel CI/CD
├── Environment secrets
├── External dependency failure isolation
└── Cloud-portable domain services
```

The map is causal, not a list of technologies: human accountability drives gates and immutable decisions; traceability drives lineage, provenance, versioning, and configuration; AI governance drives scoped retrieval and evaluation; system integrity drives authority, state, persistence, and events; delivery integrity constrains hosting without leaking Vercel concerns into the domain.
