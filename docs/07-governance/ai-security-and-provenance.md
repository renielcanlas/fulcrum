# AI security, authority, and provenance

The request path is `authenticated user → FULCRUM RBAC → context builder → permitted assessment/evidence/policy context → bounded tools → AI provider`. Tools return structured JSON and enforce authorization again. No arbitrary SQL, filesystem, HTTP, secret, or unrestricted database tools exist.

AI is allowed to extract, classify, retrieve, summarize, compare, flag, recommend, draft, and suggest. It cannot approve, reject, defer, finalize, vote, waive conditions, modify finalized decisions, or alter immutable history. Human overrides retain original and new values, actor, rationale, evidence, downstream effects, and disposition.

An AI execution record includes run ID, task, provider/model/configuration, prompt/instruction version, agent version, assessment/version, policy snapshot, retrieved/input/output references, timestamp, latency/tokens, evaluation result, and human disposition. Persist business-relevant evidence and observable reasoning artifacts; do not persist hidden chain-of-thought.
