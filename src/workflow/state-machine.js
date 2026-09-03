export const STATES = Object.freeze({
  DRAFT: "DRAFT", SUBMITTED: "SUBMITTED", INTAKE_VALIDATION: "INTAKE_VALIDATION",
  ASSESSMENT_IN_PROGRESS: "ASSESSMENT_IN_PROGRESS", ANALYST_REVIEW: "ANALYST_REVIEW",
  DECISION_READY: "DECISION_READY", COMMITTEE_REVIEW: "COMMITTEE_REVIEW",
  FINAL_DECISION: "FINAL_DECISION", CLOSED: "CLOSED", CLARIFICATION_REQUESTED: "CLARIFICATION_REQUESTED",
  REASSESSMENT_REQUESTED: "REASSESSMENT_REQUESTED"
});

export const OUTCOMES = Object.freeze({APPROVED:"APPROVED", APPROVED_WITH_CONDITIONS:"APPROVED_WITH_CONDITIONS", DEFERRED:"DEFERRED", REJECTED:"REJECTED"});

const role = (...actorTypes) => actor => actorTypes.includes(actor.type);
const has = (...fields) => assessment => fields.every(field => assessment[field]);
const justified = assessment => Boolean(assessment.justification?.trim());

export const TRANSITIONS = Object.freeze([
  {id:"T-001", from:STATES.DRAFT, to:STATES.SUBMITTED, allowed:role("PRODUCT_OWNER"), precondition:has("requiredFieldsComplete","documentsPresent"), event:"AssessmentSubmitted"},
  {id:"T-002", from:STATES.SUBMITTED, to:STATES.INTAKE_VALIDATION, allowed:role("SYSTEM"), precondition:()=>true, event:"IntakeValidationStarted"},
  {id:"T-003", from:STATES.INTAKE_VALIDATION, to:STATES.CLARIFICATION_REQUESTED, allowed:role("FCRM_ANALYST","SYSTEM"), precondition:justified, event:"ClarificationRequested"},
  {id:"T-004", from:STATES.INTAKE_VALIDATION, to:STATES.ASSESSMENT_IN_PROGRESS, allowed:role("FCRM_ANALYST"), precondition:has("intakeComplete"), event:"IntakeCompleted"},
  {id:"T-005", from:STATES.CLARIFICATION_REQUESTED, to:STATES.ASSESSMENT_IN_PROGRESS, allowed:role("PRODUCT_OWNER"), precondition:has("clarificationResponse"), event:"ClarificationResponded"},
  {id:"T-006", from:STATES.ASSESSMENT_IN_PROGRESS, to:STATES.CLARIFICATION_REQUESTED, allowed:role("FCRM_ANALYST"), precondition:justified, event:"ClarificationRequested"},
  {id:"T-007", from:STATES.ASSESSMENT_IN_PROGRESS, to:STATES.ANALYST_REVIEW, allowed:role("FCRM_ANALYST"), precondition:has("analysisComplete","calculationComplete"), event:"AssessmentPrepared"},
  {id:"T-008", from:STATES.ANALYST_REVIEW, to:STATES.ASSESSMENT_IN_PROGRESS, allowed:role("FCRM_ANALYST"), precondition:justified, event:"AssessmentReopened"},
  {id:"T-009", from:STATES.ANALYST_REVIEW, to:STATES.DECISION_READY, allowed:role("FCRM_ANALYST"), precondition:has("reviewComplete","recommendation","evidenceComplete"), event:"AssessmentDecisionReady"},
  {id:"T-010", from:STATES.DECISION_READY, to:STATES.COMMITTEE_REVIEW, allowed:role("FCRM_ANALYST"), precondition:has("decisionReadyConfirmed"), event:"CommitteeReviewStarted"},
  {id:"T-011", from:STATES.COMMITTEE_REVIEW, to:STATES.FINAL_DECISION, allowed:role("RISK_COMMITTEE"), precondition:assessment => has("decisionOutcome","decisionRationale")(assessment) && Object.values(OUTCOMES).includes(assessment.decisionOutcome), event:"CommitteeDecisionFinalized"},
  {id:"T-012", from:STATES.COMMITTEE_REVIEW, to:STATES.REASSESSMENT_REQUESTED, allowed:role("RISK_COMMITTEE"), precondition:justified, event:"ReassessmentRequested"},
  {id:"T-013", from:STATES.FINAL_DECISION, to:STATES.CLOSED, allowed:role("SYSTEM","FCRM_ANALYST"), precondition:assessment => assessment.decisionOutcome !== OUTCOMES.APPROVED_WITH_CONDITIONS || assessment.conditionsResolved === true, event:"AssessmentClosed"},
  {id:"T-014", from:STATES.FINAL_DECISION, to:STATES.REASSESSMENT_REQUESTED, allowed:role("RISK_COMMITTEE","FCRM_ANALYST"), precondition:assessment => Boolean(assessment.materialChange && justified(assessment)), event:"AssessmentVersionCreated"},
  {id:"T-015", from:STATES.CLOSED, to:STATES.REASSESSMENT_REQUESTED, allowed:role("RISK_COMMITTEE","FCRM_ANALYST"), precondition:assessment => Boolean(assessment.materialChange && justified(assessment)), event:"AssessmentVersionCreated"},
  {id:"T-016", from:STATES.REASSESSMENT_REQUESTED, to:STATES.ASSESSMENT_IN_PROGRESS, allowed:role("FCRM_ANALYST"), precondition:has("newVersion","affectedDimensions"), event:"AssessmentStarted"}
]);

export class WorkflowError extends Error { constructor(code, message) { super(message); this.code = code; } }

export class AssessmentWorkflow {
  constructor({audit, clock = () => new Date().toISOString(), eventBus = {publish() {}}} = {}) { this.audit = audit; this.clock = clock; this.eventBus = eventBus; }

  transition(assessment, actor, command = {}) {
    const transition = TRANSITIONS.find(item => item.from === assessment.state && item.id === command.transitionId);
    if (!transition) throw new WorkflowError("INVALID_TRANSITION", `Transition ${command.transitionId} is not valid from ${assessment.state}`);
    if (!transition.allowed(actor)) throw new WorkflowError("FORBIDDEN", "Actor is not permitted for this transition");
    const candidate = {...assessment, ...command};
    if (!transition.precondition(candidate)) throw new WorkflowError("PRECONDITION_FAILED", `Preconditions failed for ${transition.id}`);
    const previousState = assessment.state;
    const next = {...candidate, state:transition.to, updatedAt:this.clock(), lastTransitionId:transition.id};
    const event = {entityId:assessment.id, assessmentVersion:assessment.version, eventType:transition.event, actorId:actor.id, actorType:actor.type, previousState, newState:transition.to, timestamp:next.updatedAt, justification:command.justification ?? null, correlationId:command.correlationId ?? `${assessment.id}:${transition.id}:${next.updatedAt}`};
    this.audit?.record(event); this.eventBus.publish(event);
    return {assessment:next, event};
  }
}
