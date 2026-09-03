import {assertAssessmentAccess, canRead} from "../auth/authorization.js";
import golden from "../../data/demo/golden-initiative.json" with {type: "json"};

export function createDemoRepository() {
  const a = golden.assessment;
  const initiative = golden.initiative;
  const assessment = {
    ...a,
    ownerId: initiative.businessOwnerId,
    title: initiative.name,
    initiative,
    jira: initiative.jiraLinks,
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
    getRiskScores: (args, user) => get(user, args.assessmentId, "risk:read").riskScores,
    getRiskFactors: (args, user) => get(user, args.assessmentId, "risk:read").riskFactors,
    getControls: (args, user) => get(user, args.assessmentId, "risk:read").controls,
    getEvidence: (args, user) => get(user, args.assessmentId, "evidence:read").evidence,
    getApplicablePolicies: (args, user) => get(user, args.assessmentId, "policy:read").policies,
    getOverrides: (args, user) => get(user, args.assessmentId, "override:read").overrides,
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
