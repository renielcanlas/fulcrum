import test from "node:test";
import assert from "node:assert/strict";
import {AssessmentWorkflow, STATES, OUTCOMES, WorkflowError} from "../src/workflow/state-machine.js";
import {AuditLog} from "../src/audit/audit.js";

const actor = (type, id = type.toLowerCase()) => ({type, id});
const base = {id:"FA-2026-00124", version:1, state:STATES.DRAFT};
const run = (workflow, assessment, type, transitionId, fields = {}) => workflow.transition(assessment, actor(type), {transitionId, ...fields}).assessment;

test("workflow centralizes the governed happy path and emits events", () => {
  const audit = new AuditLog(); const events = []; const workflow = new AssessmentWorkflow({audit, eventBus:{publish:e=>events.push(e)}, clock:()=>"2026-09-03T00:00:00.000Z"});
  let a = run(workflow, {...base, requiredFieldsComplete:true, documentsPresent:true}, "PRODUCT_OWNER", "T-001");
  a = run(workflow, a, "SYSTEM", "T-002");
  a = run(workflow, {...a, intakeComplete:true}, "FCRM_ANALYST", "T-004");
  a = run(workflow, {...a, analysisComplete:true, calculationComplete:true}, "FCRM_ANALYST", "T-007");
  a = run(workflow, {...a, reviewComplete:true, recommendation:"MEDIUM", evidenceComplete:true}, "FCRM_ANALYST", "T-009");
  a = run(workflow, {...a, decisionReadyConfirmed:true}, "FCRM_ANALYST", "T-010");
  a = run(workflow, {...a, decisionOutcome:OUTCOMES.APPROVED, decisionRationale:"Committee rationale"}, "RISK_COMMITTEE", "T-011");
  assert.equal(a.state, STATES.FINAL_DECISION); assert.equal(events.at(-1).eventType, "CommitteeDecisionFinalized"); assert.equal(audit.all().length, 7);
});

test("AI is not an allowed workflow actor", () => {
  const workflow = new AssessmentWorkflow();
  assert.throws(() => workflow.transition({...base, requiredFieldsComplete:true, documentsPresent:true}, actor("AI"), {transitionId:"T-001"}), error => error instanceof WorkflowError && error.code === "FORBIDDEN");
});

test("conditional approval cannot close before conditions resolve", () => {
  const workflow = new AssessmentWorkflow();
  const assessment = {id:"a", version:1, state:STATES.FINAL_DECISION, decisionOutcome:OUTCOMES.APPROVED_WITH_CONDITIONS, conditionsResolved:false};
  assert.throws(() => workflow.transition(assessment, actor("SYSTEM"), {transitionId:"T-013"}), /Preconditions failed/);
  const closed = workflow.transition({...assessment, conditionsResolved:true}, actor("SYSTEM"), {transitionId:"T-013"}).assessment;
  assert.equal(closed.state, STATES.CLOSED);
});

test("reassessment requires a material change and creates a new version path", () => {
  const workflow = new AssessmentWorkflow();
  const result = workflow.transition({id:"a", version:1, state:STATES.CLOSED, materialChange:true}, actor("FCRM_ANALYST"), {transitionId:"T-015", justification:"New geography introduced"});
  assert.equal(result.assessment.state, STATES.REASSESSMENT_REQUESTED);
  assert.throws(() => workflow.transition(result.assessment, actor("FCRM_ANALYST"), {transitionId:"T-016"}), /Preconditions failed/);
});
