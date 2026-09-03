import golden from "../../data/demo/golden-initiative.json" with {type: "json"};
import {calculateRisk} from "../risk/scoring.js";

const assessment = golden.assessment;

function buildSourceDocuments() {
  return assessment.evidence.map((item, index) => ({
    id: `DOC-${String(index + 1).padStart(3, "0")}`,
    initiativeId: golden.initiative.id,
    filename: `${item.title.replaceAll(" ", "-").toLowerCase()}.synthetic.pdf`,
    documentVersion: 1,
    source: item.source,
    synthetic: true,
    status: "EXTRACTED"
  }));
}

function buildFacts(sourceDocuments) {
  return assessment.evidence.flatMap((item, evidenceIndex) => {
    const document = sourceDocuments[evidenceIndex];
    return item.facts.map((statement, factIndex) => ({
      id: `FACT-${String(evidenceIndex + 1).padStart(3, "0")}-${factIndex + 1}`,
      initiativeId: golden.initiative.id,
      sourceDocumentId: document.id,
      evidenceId: item.id,
      documentVersion: document.documentVersion,
      pageNumber: evidenceIndex + 1,
      section: item.locator,
      text: statement,
      extractionMethod: "SYNTHETIC_SEED",
      extractionModel: "FULCRUM-DEMO-EXTRACTOR-1.0",
      extractedAt: golden.initiative.createdAt,
      confidence: item.quality === "LOW" ? 0.72 : item.quality === "MEDIUM" ? 0.84 : 0.95
    }));
  });
}

export function createGoldenDomainModel() {
  const sourceDocuments = buildSourceDocuments();
  const facts = buildFacts(sourceDocuments);
  const scoreCalculation = calculateRisk({riskFactors: assessment.riskFactors, controls: assessment.controls});
  const riskFindings = assessment.riskFactors.map(finding => ({
    ...finding,
    initiativeId: golden.initiative.id,
    assessmentVersionId: assessment.id,
    policyRefs: assessment.policies.map(policy => policy.id),
    factRefs: finding.factRefs.flatMap(evidenceId => facts.filter(fact => fact.evidenceId === evidenceId).map(fact => fact.id)),
    evidenceRefs: finding.factRefs
  }));
  const dispositions = assessment.aiObservations.map(observation => ({
    observationId: observation.id,
    initiativeId: golden.initiative.id,
    assessmentVersionId: assessment.id,
    action: observation.status === "OVERRIDDEN_BY_ANALYST" ? "OVERRIDDEN" : observation.status === "ACCEPTED_BY_ANALYST" ? "ACCEPTED" : "PENDING",
    actorId: observation.status === "OVERRIDDEN_BY_ANALYST" || observation.status === "ACCEPTED_BY_ANALYST" ? "analyst-7" : null,
    reason: observation.id === "AIO-001" ? assessment.overrides[0].rationale : "Analyst accepted the clarification as a required open question.",
    timestamp: observation.id === "AIO-001" ? assessment.overrides[0].timestamp : "2026-09-02T15:35:00Z"
  }));
  return {
    ...golden,
    sourceDocuments,
    facts,
    riskFindings,
    scoreCalculation,
    humanDispositions: dispositions,
    lifecycle: {initiative: "DECIDED", assessment: "FINAL_DECISION", decisionOutcome: assessment.committee.finalDecision.outcome, conditions: "OPEN"},
    traceability: riskFindings.map(finding => { const aiObservationRefs = assessment.aiObservations.filter(item => item.sourceRefs.some(ref => finding.evidenceRefs.includes(ref))).map(item => item.id); return {riskFindingId: finding.id, factRefs: finding.factRefs, evidenceRefs: finding.evidenceRefs, policyRefs: finding.policyRefs, controlRefs: finding.controlRefs, calculationRef: `${assessment.id}:${scoreCalculation.calculationVersion}`, aiObservationRefs, analystDispositionRefs: dispositions.filter(item => aiObservationRefs.includes(item.observationId)).map(item => item.observationId), committeeDecisionRef: assessment.committee.finalDecision.actorId}; })
  };
}
