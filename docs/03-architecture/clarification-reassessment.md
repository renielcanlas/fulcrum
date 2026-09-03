# Clarification, invalidation, and reassessment

## Clarification loop

`Assessment → Clarification Requested → Product Owner response → affected evidence reprocessed → affected sections invalidated/recalculated → Analyst review → Assessment in Progress or Analyst Review`.

Each clarification records requester, questions, affected dimensions, due date, response, evidence references, and status. New inputs create a dependency graph. A geography change invalidates geography risk, policy applicability, impacted scores, and affected rationale; unrelated controls or dimensions remain valid. Invalidation is explicit and visible, not a silent overwrite.

## Material reassessment

A `MaterialChange` records trigger type, source evidence, affected dimensions, detected-by, reviewer, and decision. Triggers include geography, customer segment, product capability, payment flow, vendor, process, control change, or material document change. A new assessment version is created; previous scores, evidence, rationale, AI outputs, overrides, and decisions remain immutable and linked. Only affected dimensions are reassessed where dependency analysis supports it; otherwise the system escalates for Analyst determination.
