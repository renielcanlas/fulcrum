import test from "node:test";
import assert from "node:assert/strict";
import {routeForTask, ROUTES} from "../src/ai/routing.js";
import {validateReferences, validateTaskOutput} from "../src/ai/contract-validation.js";
import {evaluateGoldenFixture} from "../src/evaluation/golden-evaluation.js";

test("routing keeps deterministic work out of the model", () => {
  assert.equal(routeForTask("risk-scoring"), ROUTES.DETERMINISTIC);
  assert.equal(routeForTask("document-structure-extraction"), ROUTES.DOCUMENT_INTELLIGENCE);
  assert.equal(routeForTask("conversational-qa"), ROUTES.FAST);
  assert.equal(routeForTask("conversational-qa", {material:true}), ROUTES.REASONING);
});

test("contract validation rejects identifiers outside the allowed context", () => {
  const allowed = [{type:"EVIDENCE", id:"EV-001", version:"1"}];
  assert.equal(validateReferences(allowed, allowed).valid, true);
  assert.equal(validateReferences([{type:"EVIDENCE", id:"EV-999", version:"1"}], allowed).valid, false);
  const result = validateTaskOutput({assessmentId:"a", assessmentVersionId:"a:v1", material:true, output:{evidenceReferences:[{type:"EVIDENCE", id:"EV-999", version:"1"}]}, allowedReferences:allowed});
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("INVALID_REFERENCE"));
});

test("Golden Initiative evaluation reports measured lineage and honest gaps", () => {
  const result = evaluateGoldenFixture();
  assert.equal(result.classification, "MEASURED");
  assert.equal(result.metrics.riskFactorEvidenceCoverage, 1);
  assert.equal(result.metrics.riskFactorControlCoverage, 1);
  assert.equal(result.metrics.aiCitationValidity, 1);
  assert.equal(result.metrics.deterministicScore, 78);
  assert.equal(result.metrics.deterministicRating, "HIGH");
  assert.equal(result.metrics.analystOverridePreserved, true);
  assert.ok(result.notMeasured.includes("retrieval_precision"));
});
