# Security model

Threats include unauthorized case access, malicious documents and prompt injection, data exfiltration through tools/models, fabricated citations, poisoned retrieval, privilege escalation, tampered audit, and provider outage. Controls: SSO/RBAC and least privilege; application-enforced authorization; encrypted transport/storage; secret manager; malware/parser sandbox; content/instruction separation; allowlisted tools and egress; DLP/redaction policy; immutable audit; model/provider access policy; rate limits; validation and human gates; backups and incident response. Synthetic data is mandatory until data handling is approved.

Security acceptance tests must include cross-role access denial, prompt injection, malicious file handling, citation grounding, tool authorization, audit tamper detection, secret exposure, and fail-closed workflow transitions.
