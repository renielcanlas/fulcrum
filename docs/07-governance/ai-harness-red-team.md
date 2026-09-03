# FULCRUM AI harness red-team

Status: **Step 7.7 — completed against the current implementation**.

This review tests the current bounded Copilot, tool registry, synthetic fixture, authorization, workflow, and audit seams. Live Azure, Jira, and PostgreSQL failure tests remain adapter-level work because those integrations are not configured in the repository.

## Findings and resolutions

| Severity | Finding | Resolution/status |
|---|---|---|
| HIGH | A model could request a different assessment ID than the active request | Fix in implementation: reject tool calls whose assessment ID differs from the governed request |
| HIGH | Multiple model tool calls could create excessive loops or repeated sensitive reads | Fix in implementation: bounded tool-call count and read-only allowlist |
| HIGH | Malformed tool arguments could produce an unhandled request failure | Fix in implementation: return governed tool/validation error and audit failure |
| HIGH | Current runtime labels provider as OpenAI-compatible even when target direction is Azure | Documented adapter limitation; no governance impact, but provenance must use actual provider metadata when Azure adapter is added |
| MEDIUM | Jira/document prompt injection is addressed by instructions but not yet automated by tests | Add adversarial content tests at contract/context layer; current tools do not execute content as instructions |
| MEDIUM | No persisted orchestration execution state | Expected: PostgreSQL/worker implementation; fixture-backed demo limitation |
| MEDIUM | No live retrieval citation validator | Contract documented; implement with retrieval corpus |
| LOW | In-memory sessions are not reliable across Vercel instances | Known deployment limitation; external session store required before production-shaped deployment |
| OVER-ENGINEERED | Multi-agent swarm, autonomous action planner, full event-sourcing | Deferred/rejected by ADR-031 |

## Attack scenarios

| Scenario | Expected control | Current result |
|---|---|---|
| Injection in Jira description asks for approval | Content is untrusted; assistant refuses decision | Governed instructions and no decision tool |
| Attachment asks model to expose secrets | No secrets/context/tool access | No secret-bearing tools exist |
| Invented policy/evidence ID | Referential validation rejects it | Contract requirement; validator implementation remains next increment |
| Stale policy/evidence | Version/freshness metadata and `UNKNOWN` | Documented; live retrieval not configured |
| Contradictory evidence | No auto-resolution; analyst clarification | Fixture and architecture support this path |
| AI transition/vote/approval attempt | No write tools; workflow rejects AI actor | Automated workflow test passes |
| Repeated tool loop | Maximum tool calls, then safe failure | Hardened in current orchestrator |
| Unauthorized assessment | Backend tool authorization | Automated security test passes |
| Jira outage/401/429 | Adapter retry/fallback/degraded context | Architecture documented; live adapter not present |

## Step 7 lock

No unresolved blocker remains in the AI architecture. The safe high-risk runtime issues are bounded tool calls, active-assessment scope enforcement, and malformed-call handling; these are implemented in the current increment. Live provider, retrieval, and durable-state controls remain explicit implementation work, not hidden claims.

**Step 7 verdict: LOCKED WITH IMPLEMENTATION FOLLOW-UPS.**
