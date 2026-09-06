import test from "node:test";
import assert from "node:assert/strict";
import {FakeProvider} from "../src/ai/provider.js";
import {buildIntakeDecisionSupportInput, calculateWeightedIntakeDecision, generateEvaluationDecisionSupport, generateIntakeDecisionSupport, parseIntakeDecisionSupport} from "../src/ai/intake-decision-support.js";
import {getStageEvaluationConfig, evaluateStage} from "../src/integrations/stage-evaluation.js";
import {formatIntakeAssessmentComment} from "../src/integrations/intake-assessment.js";

const assessment = {version: "intake-v1", stage: "Intake", score: 80, maxScore: 100, recommendation: "Proceed", checks: []};
const item = {key: "FCRM-80", summary: "Review payment controls", description: "Review the controls before launch.", statusName: "Intake", comments: [{author: "Maya Chen", body: "Please confirm the owner.", created: "2026-09-06T00:00:00Z"}], attachments: [{filename: "risk-brief.pdf", mimeType: "application/pdf", size: 1234, author: "Maya Chen"}]};

test("intake AI context includes Jira comments, attachment inventory, and deterministic metrics", () => {
  const input = buildIntakeDecisionSupportInput({item, assessment, attachmentEvidence: [{attachmentId: "1002", filename: "risk-brief.pdf", status: "completed", source: "jira-attachment:1002", content: "Page one text", pages: [{page: 1, text: "Page one text"}]}]});
  assert.match(input, /risk-brief\.pdf/);
  assert.match(input, /Please confirm the owner/);
  assert.match(input, /deterministicAssessment/);
  assert.match(input, /contentAvailableToModel/);
  assert.match(input, /Page one text/);
});

test("intake decision support parses a constrained recommendation", async () => {
  const provider = new FakeProvider([{id: "resp-intake-1", output_text: JSON.stringify({confidence: 0.82, summary: "The intake is sufficiently documented.", challenge: "Confirm the control owner before proceeding.", pros: ["Clear business scope."], cons: ["Owner confirmation remains open."], rationale: ["Owner and scope are present."], checkReviews: [{checkId: "description", state: "pass", observation: "Context is clear."}], proposedComment: "AI decision support: Proceed, subject to human review."})}]);
  const result = await generateIntakeDecisionSupport({provider, item, assessment: {...assessment, checks: [{id: "description", label: "Business context", weight: 20, state: "pass", points: 20}], maxScore: 20}});
  assert.equal(result.responseId, "resp-intake-1");
  assert.equal(result.decisionSupport.recommendation, "Hold for remediation");
  assert.equal(result.decisionSupport.confidence, 0.82);
  assert.equal(result.decisionSupport.checkReviews[0].points, 20);
  assert.equal(result.decisionSupport.challenge, "Confirm the control owner before proceeding.");
  assert.deepEqual(result.decisionSupport.pros, ["Clear business scope."]);
  assert.deepEqual(result.decisionSupport.cons, ["Owner confirmation remains open."]);
});

test("published intake comment keeps deterministic recommendation and includes AI proposal", () => {
  const comment = formatIntakeAssessmentComment({...assessment, aiDecisionSupport: {recommendation: "Hold for remediation", confidence: 0.7, proposedComment: "AI decision support: Hold until the owner is confirmed."}});
  assert.match(comment, /Recommendation: Proceed/);
  assert.match(comment, /Weighted decision: Proceed \(80\/100\)/);
  assert.match(comment, /AI response:/);
  assert.match(comment, /AI recommendation: Hold for remediation/);
  assert.match(comment, /owner is confirmed/);
});

test("invalid intake AI response is rejected instead of treated as an approval", () => {
  assert.throws(() => parseIntakeDecisionSupport(JSON.stringify({recommendation: "Proceed"})), /intake_ai_response_incomplete/);
});

test("intake decision weighting applies 25 percent automatic and 75 percent AI", () => {
  const decision = calculateWeightedIntakeDecision({automaticScore: 100, aiScore: 40, maxScore: 100, weighting: {automaticPercent: 25, aiPercent: 75}});
  assert.equal(decision.score, 55);
  assert.equal(decision.recommendation, "Hold for remediation");
  assert.equal(decision.automaticPercent, 25);
  assert.equal(decision.aiPercent, 75);
});

test("stage AI context uses the current stage parameters", async () => {
  const stage = "Risk Assessment";
  const stageConfig = getStageEvaluationConfig(stage);
  const stageAssessment = evaluateStage({...item, statusName: stage}, stage);
  const provider = new FakeProvider([{id: "resp-risk-1", output_text: JSON.stringify({confidence: 0.8, summary: "Risk context is reviewable.", challenge: "Confirm residual risk ownership.", pros: ["Risk domain is identified."], cons: ["Control evidence is limited."], rationale: ["The issue includes risk context."], checkReviews: stageAssessment.checks.map((check) => ({checkId: check.id, state: "pass", observation: "Reviewed for the current risk stage."})), proposedComment: "AI decision support: review residual risk ownership."})}]);
  const result = await generateEvaluationDecisionSupport({provider, item: {...item, statusName: stage}, assessment: stageAssessment, stage, stageConfig});
  assert.equal(result.decisionSupport.stage, stage);
  assert.equal(result.decisionSupport.checkReviews.length, stageAssessment.checks.length);
  assert.match(buildIntakeDecisionSupportInput({item, assessment: stageAssessment, stage, stageConfig}), /Risk Assessment/);
  assert.match(JSON.stringify(stageConfig.aiParameters), /residual uncertainty/);
});
