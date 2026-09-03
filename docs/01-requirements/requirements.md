# Requirements and traceability

Status: bootstrap baseline. Product and control owners must validate before implementation.

| ID | Requirement | Acceptance evidence | Owner |
|---|---|---|---|
| REQ-001 | Capture and track a change request through governed lifecycle states. | State-transition and authorization tests; audit events. | Product/FCRM |
| REQ-002 | Maintain structured initiative, risk, control, evidence, policy, finding, decision, and review records. | Data model/schema tests. | Architecture |
| REQ-003 | Extract facts and gaps from submitted documents with source spans and uncertainty. | Golden extraction evaluation. | AI/FCRM |
| REQ-004 | Retrieve applicable policy/framework material with citations and source/interpretation separation. | Retrieval and citation evaluation. | FCRM/Legal |
| REQ-005 | Produce structured risk observations and a draft assessment; never make the final decision. | Agent contract tests and human gate. | FCRM |
| REQ-006 | Calculate ratings deterministically from configurable, versioned parameters. | Calculation/property tests; parameter audit. | FCRM/Engineering |
| REQ-007 | Preserve analyst review, challenge, overrides, rationale, and downstream impact. | Override/audit tests. | FCRM |
| REQ-008 | Support committee approve, reject, defer, and approve-with-conditions actions with authorization. | Workflow/negative authorization tests. | Committee |
| REQ-009 | Reconstruct a case months later, including AI provenance and retrieved context. | Audit replay test. | Risk/Engineering |
| REQ-010 | Provide grounded conversational Q&A over governed case context. | Grounding, refusal, and citation tests. | Product |
| REQ-011 | Allow authorized configuration of scoring, thresholds, and workflow without code deployment. | Configuration versioning and approval tests. | FCRM |
| REQ-012 | Provide synthetic golden datasets, AI evaluations, regression tests, and quality feedback loops. | Evaluation reports in `.ai/evaluations/`. | QA/AI |
| REQ-013 | Connect requirements through design, implementation, tests, deployment, and operational metrics. | Traceability matrix and CI checks. | Engineering |
| REQ-014 | Support interchangeable AI providers through adapters and record provider/model/version. | Provider contract tests. | AI Platform |
| REQ-015 | Enforce RBAC, least privilege, prompt/document threat controls, and secrets protection. | Threat-model review and security tests. | Security |

## Traceability convention

Use `REQ-NNN` in ADRs, Jira-ready work items, schemas, test names, deployment checks, and metrics. The implementation matrix will be maintained at `docs/01-requirements/traceability.md`; each row links requirement → decision → artifact/code → test → deployment check → metric. Missing links are release blockers for material behavior.

## Assumptions and open questions

See [assumptions-open-questions.md](../00-context/assumptions-open-questions.md). These are not requirements until owners accept them.
