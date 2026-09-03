import golden from "../../data/demo/golden-initiative.json" with {type: "json"};
import {createGoldenDomainModel} from "../domain/golden-model.js";

export function evaluateGoldenFixture() {
  const model = createGoldenDomainModel();
  const evidenceIds = new Set(golden.assessment.evidence.map(item => item.id));
  const controlIds = new Set(golden.assessment.controls.map(item => item.id));
  const riskFindings = golden.assessment.riskFactors;
  const linkedFacts = riskFindings.filter(item => item.factRefs.every(ref => evidenceIds.has(ref))).length;
  const linkedControls = riskFindings.filter(item => item.controlRefs.every(ref => controlIds.has(ref))).length;
  const aiRefs = golden.assessment.aiObservations.filter(item => item.sourceRefs.every(ref => evidenceIds.has(ref))).length;
  const override = golden.assessment.overrides[0];
  return {
    dataset: golden.dataset,
    classification: "MEASURED",
    metrics: {
      riskFactorEvidenceCoverage: linkedFacts / riskFindings.length,
      riskFactorControlCoverage: linkedControls / riskFindings.length,
      aiCitationValidity: aiRefs / golden.assessment.aiObservations.length,
      deterministicScore: model.scoreCalculation.residualScore,
      deterministicRating: model.scoreCalculation.residualRating,
      analystOverridePreserved: Boolean(override && override.originalValue !== override.newValue && override.rationale),
      committeeDecisionPresent: golden.assessment.committee.finalDecision.outcome === "APPROVED_WITH_CONDITIONS"
    },
    notMeasured: ["provider_token_usage", "provider_latency", "retrieval_precision", "fact_precision_recall", "human_acceptance_rate"]
  };
}
