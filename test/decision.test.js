import test from "node:test";
import assert from "node:assert/strict";
import {DECISION_OUTCOMES, formatDecisionComment, parsePublishedDecisions, validateDecision} from "../src/integrations/decision.js";

const evaluation = {stage: "Review", revision: 2, score: 86, weightedDecision: {score: 82, recommendation: "Proceed"}};

test("human decision requires rationale and validates conditions", () => {
  const decision = validateDecision({outcome: DECISION_OUTCOMES.ACCEPTED, rationale: "Proceed with the reviewed initiative."}, {actorId: "committee-1", actorName: "Helen Morgan", actorRole: "RISK_COMMITTEE", evaluation});
  assert.equal(decision.label, "Accepted");
  assert.equal(decision.conditions.length, 0);
  assert.equal(decision.evaluation.weightedScore, 82);
});

test("human decision rejects missing rationale and condition fields", () => {
  assert.throws(() => validateDecision({outcome: "ACCEPTED", rationale: "short"}, {evaluation}), /decision_rationale_required/);
  assert.throws(() => validateDecision({outcome: "APPROVED", rationale: "Needs controls."}, {evaluation}), /decision_outcome_invalid/);
  assert.throws(() => validateDecision({outcome: "ACCEPTED", rationale: "Needs controls.", conditions: [{description: "Add control", owner: "Helen", dueDate: "2026-10-01"}]}, {evaluation}), /decision_conditions_not_supported/);
});

test("decision comments preserve a readable body and recover structured history", () => {
  const decision = validateDecision({outcome: "REJECTED", rationale: "The evidence does not support proceeding."}, {actorId: "committee-1", actorName: "Helen Morgan", actorRole: "RISK_COMMITTEE", evaluation});
  const body = formatDecisionComment(decision);
  const parsed = parsePublishedDecisions([{id: "comment-1", created: "2026-09-06T12:00:00Z", body}]);
  assert.match(body, /FULCRUM human decision/);
  assert.equal(parsed[0].outcome, "REJECTED");
  assert.equal(parsed[0].actor.name, "Helen Morgan");
});
