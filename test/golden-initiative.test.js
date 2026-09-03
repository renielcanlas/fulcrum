import test from "node:test";
import assert from "node:assert/strict";
import golden from "../data/demo/golden-initiative.json" with {type: "json"};
import {createDemoRepository, createToolRegistry} from "../src/tools/assessment-tools.js";

const assessmentId = "FA-2026-00124";
const analyst = {id: "analyst-7", role: "FCRM_ANALYST"};

test("golden fixture is synthetic and covers the required risk domains", () => {
  assert.equal(golden.synthetic, true);
  assert.equal(golden.initiative.name, "Launch U.S.–Philippines Instant Remittance");
  assert.equal(golden.assessment.committee.finalDecision.outcome, "APPROVED_WITH_CONDITIONS");
  assert.equal(golden.initiative.status, "DECIDED");
  assert.equal(golden.assessment.riskFactors.length, 11);
  assert.deepEqual(
    golden.assessment.riskFactors.map(factor => factor.domain),
    ["MONEY_LAUNDERING", "TERRORIST_FINANCING", "SANCTIONS", "FRAUD", "GEOGRAPHIC", "CUSTOMER", "PRODUCT_SERVICE", "TRANSACTION", "DELIVERY_CHANNEL", "THIRD_PARTY_VENDOR", "CONTROL_EFFECTIVENESS"]
  );
});

test("every golden risk finding resolves to evidence and controls", () => {
  const evidence = new Set(golden.assessment.evidence.map(item => item.id));
  const controls = new Set(golden.assessment.controls.map(item => item.id));
  for (const finding of golden.assessment.riskFactors) {
    assert.ok(finding.factRefs.length > 0);
    assert.ok(finding.controlRefs.length > 0);
    finding.factRefs.forEach(ref => assert.ok(evidence.has(ref), `${finding.id} missing ${ref}`));
    finding.controlRefs.forEach(ref => assert.ok(controls.has(ref), `${finding.id} missing ${ref}`));
  }
});

test("demo tools expose the golden initiative, override, and committee outcome", () => {
  const tools = createToolRegistry(createDemoRepository());
  const summary = tools.execute("getAssessmentSummary", {assessmentId}, analyst);
  assert.equal(summary.title, golden.initiative.name);
  assert.equal(summary.decision, "APPROVED_WITH_CONDITIONS");
  assert.equal(tools.execute("getInitiativeSummary", {assessmentId}, analyst).id, "INIT-2026-0007");
  assert.equal(tools.execute("getOverrides", {assessmentId}, analyst)[0].newValue, "MEDIUM");
  assert.equal(tools.execute("getCommitteeDecision", {assessmentId}, analyst).finalDecision.actor, "Helen Morgan");
});
