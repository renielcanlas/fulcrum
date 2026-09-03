# Human-in-the-loop and audit model

AI assists with preparation, never final approval/rejection. Product owners answer material clarifications. Analysts validate facts, evidence, policy applicability, risk observations, scoring inputs, completeness, and recommendations. Authorized configuration owners publish scoring/workflow versions. Committee members challenge and decide approve, reject, defer, or approve with conditions.

Append-only audit events capture actor/service, action, case, time, reason, prior/new state, source refs, artifact hashes, contract/instruction version, provider/model/version, retrieved context refs, validation, reviewer, override, and downstream impact. Corrections are compensating events, never silent edits. Access to audit and evidence is RBAC-controlled and export must preserve provenance.
