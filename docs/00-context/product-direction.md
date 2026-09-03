# Product direction

## Positioning

FULCRUM is a **Financial Crime Decision Intelligence Workbench**, not a core-banking transaction system and not a generic project-management application. It helps management, Product Owners, FCRM Analysts, and Risk Committees understand what financial-crime risk a proposed business change introduces, why it exists, what evidence supports it, what controls mitigate it, what residual risk remains, and who accepted that risk.

## Primary domain object

The central object is an `Initiative`: a proposed business change such as a digital-wallet launch, geographic expansion, new payment flow, vendor onboarding, customer-segment change, or onboarding-process modification. An Initiative is the single FULCRUM source of truth for its business context and linked FCRM assessment.

An Initiative owns or references type, description, justification, business owner, dates, participants, FCRM analysts, decision makers, comments, documents, evidence, questions/responses, risk assessments, controls, decisions, overrides, conditions, and activity/audit history. Existing `ChangeRequest` terminology is treated as the implementation precursor/compatibility alias and should converge on `Initiative` through an explicit schema decision.

## Differentiation

The differentiator is financial-crime intelligence: evidence-grounded risk decomposition, deterministic inherent/control/residual views, explainability, governed AI assistance, analyst challenge, and examiner-ready reconstruction. Workflow and Jira integration support this capability; they are not the product by themselves.

## Product boundary

Reuse commodity work-management capabilities from Jira, ServiceNow, or Microsoft 365 where appropriate. FULCRUM remains responsible for financial-crime domain intelligence, assessment, evidence, controls, knowledge, explainability, AI orchestration, and decision governance. Initial assistant behavior is read-only decision intelligence; official state changes require explicit human actions.

## Naming note

The product name remains **FULCRUM**. The working expansion has appeared in more than one brief and is therefore an open naming decision; this document does not silently rename the project. See [assumptions and open questions](assumptions-open-questions.md).
