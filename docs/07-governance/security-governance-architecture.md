# Security & Governance Architecture

## Governing rule

Deterministic systems enforce policy and permissions. AI assists with analysis and preparation. Humans retain authority for consequential financial-crime decisions. No model or autonomous agent may approve, reject, defer, waive, vote, or finalize an assessment.

## Trust boundaries

```text
┌──────────────┐      authenticated session       ┌──────────────────────────┐
│ Browser / UI │ ────────────────────────────────→ │ FULCRUM backend           │
└──────────────┘                                  │ identity · RBAC · CSRF    │
                                                  │ workflow · audit          │
                                                  └───────┬───────────┬──────┘
                                                          │           │
                                                   ┌──────▼─────┐ ┌──▼─────────────┐
                                                   │ Domain DB  │ │ AI Gateway     │
                                                   │ risk truth │ │ context/tools  │
                                                   └────────────┘ └──┬─────────────┘
                                                                      │ scoped data
                                                              ┌───────▼────────┐
                                                              │ OpenAI/provider │
                                                              └────────────────┘

                   ┌──────────────────────┐     ┌───────────────────────┐
                   │ Jira Gateway/Adapter │ ──→ │ Atlassian Jira Cloud  │
                   │ OAuth credential use│     └───────────────────────┘
                   └──────────┬───────────┘
                              │
                       ┌──────▼─────────┐
                       │ Secret Provider│
                       └────────────────┘
```

FULCRUM authentication answers who is using the application. Atlassian OAuth answers whether FULCRUM may access a Jira tenant on that user’s behalf. Jira is not FULCRUM’s identity provider and Jira permissions do not grant FCRM decision authority.

## Credential locations

Azure AI Foundry/Document Intelligence and Jira secrets exist only in backend adapters or a managed secret provider. They must not appear in browser bundles, local storage, prompts, model context, issue content, database fields available to ordinary application access, audit events, or logs. The demo uses environment variables; production uses Azure Key Vault, AWS Secrets Manager, GCP Secret Manager, or an equivalent enterprise service behind the same secret-access interface.

Jira-sourced initiative and collaboration data is treated as external authoritative content. FULCRUM stores only permission-checked references or bounded evidence snapshots/hashes required for an assessment. General Jira comments and attachments are not copied into ordinary FCRM records; a comment or attachment used as evidence must carry an exact source identifier and locator.

## Demo versus production

| Capability | Hackathon demo | Production target |
|---|---|---|
| Authentication | Synthetic persona selector; no passwords | Enterprise OIDC/SAML SSO with MFA |
| Provisioning | Seeded demo users | IAM lifecycle provisioning/deprovisioning |
| Authorization | Server-side application RBAC | Enterprise RBAC, possible ABAC, periodic review |
| Jira | OAuth 2.0 3LO adapter/metadata | Managed consent, rotation, revocation, monitoring |
| Model secrets | Environment-based key | Managed secret/KMS platform |
| Data | Synthetic only | Approved governed banking data |
| Audit | Append-only application events | Immutable/WORM-capable enterprise storage |
| Encryption | Platform-supported | Enterprise KMS and key policies |
| Monitoring | Application telemetry | SIEM/SOC integration and alerting |
| User termination | Manual demo session removal | Automated identity lifecycle enforcement |

The demo shortcut is deliberate and must not be represented as production authentication.
