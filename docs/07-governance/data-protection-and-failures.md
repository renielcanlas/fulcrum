# Data protection and security failure behavior

Hackathon data is synthetic. Categories include public regulatory content, synthetic internal policy, synthetic requests/evidence, assessments and decisions, user identity, integration credentials, audit data, and AI execution metadata. Use TLS, platform encryption at rest, least privilege, secret masking, environment isolation, safe errors, request correlation IDs, validation, and practical rate limits.

| Failure | Required behavior |
|---|---|
| Unauthorized action/invalid role | Reject, audit security event, do not mutate |
| Jira token expired/permission denied | Refresh or mark connection degraded; do not broaden access |
| Jira unavailable | Record pending/failed sync and retry; do not fail unrelated FULCRUM transaction |
| Model unavailable/missing credential | Allow manual workflow where reasonable; never skip human gates |
| Secret provider unavailable | Fail closed for dependent integration; do not use fallback plaintext |
| AI tool invocation denied | Return controlled error/escalation; no privilege elevation |
| Invalid audit event | Reject material command or route to durable failure handling |
| Unauthorized configuration change | Reject and record `ConfigurationPermissionRejected` |
| User loses access mid-workflow | Re-check permission at command/tool time; deny and preserve history |
