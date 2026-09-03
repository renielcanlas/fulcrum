import {assertAssessmentAccess, canRead} from "../auth/authorization.js";
import golden from "../../data/demo/golden-initiative.json" with {type: "json"};
import {createGoldenDomainModel} from "../domain/golden-model.js";

export function createDemoRepository() {
  const a = golden.assessment;
  const initiative = golden.initiative;
  const domain = createGoldenDomainModel();
  const assessment = {
    ...a,
    ownerId: initiative.businessOwnerId,
    title: initiative.name,
    initiative,
    jira: initiative.jiraLinks,
    sourceDocuments: domain.sourceDocuments,
    facts: domain.facts,
    evidence: a.evidence.map((item, index) => ({...item, initiativeId: initiative.id, sourceDocumentId: domain.sourceDocuments[index].id, documentVersion: 1, extractionMethod: "SYNTHETIC_SEED", extractionModel: "FULCRUM-DEMO-EXTRACTOR-1.0", extractedAt: initiative.createdAt})),
    riskFindings: domain.riskFindings,
    scoreCalculation: domain.scoreCalculation,
    humanDispositions: domain.humanDispositions,
    traceability: domain.traceability,
    lifecycle: domain.lifecycle,
    history: initiative.activity.map((event, index) => ({version: index + 1, ...event})),
    conditions: a.conditions.map(condition => condition.description)
  };
  return {
    assessments: new Map([[assessment.id, assessment]]),
    initiatives: new Map([[initiative.id, initiative]])
  };
}

export function createToolRegistry(repository) {
  const get = (user, id, permission = "assessment:read") => {
    const assessment = repository.assessments.get(id);
    assertAssessmentAccess(user, assessment, permission);
    return assessment;
  };
  const tools = {
    getAssessmentSummary: (args, user) => { const a = get(user, args.assessmentId); return {id:a.id, initiativeId:a.initiativeId, title:a.title, version:a.version, status:a.status, decision:a.committee.finalDecision.outcome, currentOwnerId:a.currentOwnerId}; },
    getInitiativeSummary: (args, user) => { const a = get(user, args.assessmentId); const i = a.initiative; return {id:i.id, name:i.name, type:i.type, description:i.description, businessOwner:i.businessOwner, status:i.status, participants:i.participants, decisionMakers:i.decisionMakers, businessContext:i.businessContext}; },
    getRiskScores: (args, user) => { const a = get(user, args.assessmentId, "risk:read"); return {...a.riskScores, inherentScore:a.scoreCalculation.inherentScore, residualScore:a.scoreCalculation.residualScore, residualRisk:a.scoreCalculation.residualRating, calculationVersion:a.scoreCalculation.calculationVersion, configurationId:a.scoreCalculation.configurationId}; },
    getRiskFactors: (args, user) => get(user, args.assessmentId, "risk:read").riskFindings,
    getRiskTraceability: (args, user) => get(user, args.assessmentId, "risk:read").traceability,
    getScoreCalculation: (args, user) => get(user, args.assessmentId, "risk:read").scoreCalculation,
    getControls: (args, user) => get(user, args.assessmentId, "risk:read").controls,
    getEvidence: (args, user) => get(user, args.assessmentId, "evidence:read").evidence,
    getExtractedFacts: (args, user) => get(user, args.assessmentId, "evidence:read").facts,
    getSourceDocuments: (args, user) => get(user, args.assessmentId, "evidence:read").sourceDocuments,
    getApplicablePolicies: (args, user) => get(user, args.assessmentId, "policy:read").policies,
    getOverrides: (args, user) => get(user, args.assessmentId, "override:read").overrides,
    getHumanDispositions: (args, user) => get(user, args.assessmentId, "override:read").humanDispositions,
    getJiraWorkItems: (args, user) => get(user, args.assessmentId, "jira:read:linked").jira,
    getConditions: (args, user) => get(user, args.assessmentId, "conditions:read").conditions,
    getAssessmentHistory: (args, user) => get(user, args.assessmentId).history,
    getCommitteeDecision: (args, user) => get(user, args.assessmentId, "decision:read").committee,
    getInitiativeComments: (args, user) => get(user, args.assessmentId).initiative.comments,
    getInitiativeActivity: (args, user) => get(user, args.assessmentId).initiative.activity
  };
  return {execute(name, args, user) { if (!tools[name]) throw new Error("UNKNOWN_TOOL"); return tools[name](args, user); }, names: () => Object.keys(tools)};
}

export function toolDefinitions(names) {
  return names.map(name => ({type: "function", name, description: `Read governed ${name} data for the active assessment.`, strict: true, parameters: {type:"object", properties:{assessmentId:{type:"string"}}, required:["assessmentId"], additionalProperties:false}}));
}
