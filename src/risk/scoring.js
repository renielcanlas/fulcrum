const RATING_VALUE = Object.freeze({LOW: 1, MEDIUM: 3, HIGH: 5});
const CONTROL_VALUE = Object.freeze({INEFFECTIVE: 0, PARTIAL: 0.5, EFFECTIVE: 1});

/**
 * Small, transparent demo calculator. Production weights and thresholds must
 * be approved, versioned configuration rather than constants in this module.
 */
export function calculateRisk({riskFactors, controls, configuration = {id: "FULCRUM-SYNTH-CONFIG-1.2", mitigationScale: 18, thresholds: {mediumMax: 69, highMin: 70}}}) {
  if (!Array.isArray(riskFactors) || !riskFactors.length) throw new Error("RISK_FACTORS_REQUIRED");
  if (!Array.isArray(controls) || !controls.length) throw new Error("CONTROLS_REQUIRED");
  const factorValues = riskFactors.map(factor => ({riskFactorId: factor.id, rating: factor.rating, value: RATING_VALUE[factor.rating] ?? (() => { throw new Error(`INVALID_RATING_${factor.rating}`); })()}));
  const controlValues = controls.map(control => ({controlId: control.id, effectiveness: control.effectiveness, value: CONTROL_VALUE[control.effectiveness] ?? (() => { throw new Error(`INVALID_EFFECTIVENESS_${control.effectiveness}`); })()}));
  const inherentScore = Math.round(factorValues.reduce((sum, item) => sum + item.value, 0) / factorValues.length * 20);
  const averageControlEffectiveness = controlValues.reduce((sum, item) => sum + item.value, 0) / controlValues.length;
  const mitigation = Math.round(averageControlEffectiveness * configuration.mitigationScale);
  const residualScore = Math.max(0, inherentScore - mitigation);
  const residualRating = residualScore >= configuration.thresholds.highMin ? "HIGH" : residualScore > configuration.thresholds.mediumMax ? "MEDIUM" : "LOW";
  return {
    configurationId: configuration.id,
    calculationVersion: "FULCRUM-DEMO-SCORING-1.0",
    inputFactors: factorValues,
    controlAdjustments: controlValues,
    inherentScore,
    mitigation,
    residualScore,
    residualRating,
    thresholds: configuration.thresholds,
    trace: [
      {step: "INHERENT_SCORE", formula: "average(risk factor values) × 20", result: inherentScore, inputs: factorValues.map(item => item.riskFactorId)},
      {step: "CONTROL_MITIGATION", formula: "average(control effectiveness) × mitigationScale", result: mitigation, inputs: controlValues.map(item => item.controlId)},
      {step: "RESIDUAL_SCORE", formula: "max(0, inherentScore − mitigation)", result: residualScore, inputs: ["inherentScore", "mitigation"]},
      {step: "RATING_THRESHOLD", formula: "threshold lookup", result: residualRating, inputs: ["residualScore", "thresholds"]}
    ]
  };
}
