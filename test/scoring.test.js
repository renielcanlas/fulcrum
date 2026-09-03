import test from "node:test";
import assert from "node:assert/strict";
import {createGoldenDomainModel} from "../src/domain/golden-model.js";
import {calculateRisk} from "../src/risk/scoring.js";

test("golden scoring is deterministic and produces an explainable trace", () => {
  const model = createGoldenDomainModel();
  const calculation = model.scoreCalculation;
  assert.equal(calculation.residualScore, 78);
  assert.equal(calculation.residualRating, "HIGH");
  assert.equal(calculation.configurationId, "FULCRUM-SYNTH-CONFIG-1.2");
  assert.deepEqual(calculation.trace.map(step => step.step), ["INHERENT_SCORE", "CONTROL_MITIGATION", "RESIDUAL_SCORE", "RATING_THRESHOLD"]);
  assert.deepEqual(calculateRisk({riskFactors:model.assessment.riskFactors, controls:model.assessment.controls}), calculation);
});

test("control changes alter the calculated result without mutating the fixture", () => {
  const model = createGoldenDomainModel();
  const controls = model.assessment.controls.map(control => ({...control, effectiveness: "EFFECTIVE"}));
  const changed = calculateRisk({riskFactors:model.assessment.riskFactors, controls});
  assert.ok(changed.residualScore < model.scoreCalculation.residualScore);
  assert.equal(model.scoreCalculation.residualScore, 78);
});
