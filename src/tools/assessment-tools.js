import {assertAssessmentAccess, canRead} from "../auth/authorization.js";

export function createDemoRepository() {
  const assessments = new Map([[
    "FA-2026-00124", {
      id: "FA-2026-00124", ownerId: "po-1", title: "Cross-Border Wallet Expansion", version: 3,
      status: "ANALYST_REVIEW", riskScores: {amlResidual: "HIGH", score: 78, threshold: 70, rule: "AML-RULE-04"},
      riskFactors: ["cross-border transaction capability", "non-face-to-face onboarding", "elevated geographic exposure"],
      controls: [{name: "KYC onboarding", effectiveness: "PARTIAL"}, {name: "Sanctions screening", effectiveness: "EFFECTIVE"}],
      evidence: ["Product Specification §4.2", "Customer Eligibility Response Q17"],
      policies: ["FULCRUM Synthetic AML Policy §7.3"],
      overrides: [{from: "HIGH", to: "MEDIUM", reason: "Customer eligibility excludes non-resident customers.", actor: "analyst-7", version: 2}],
      jira: [{key: "FCRM-42", summary: "Complete sanctions-control remediation", status: "IN_PROGRESS"}],
      conditions: ["Complete sanctions-control remediation"],
      history: [{version: 2, rating: "MEDIUM"}, {version: 3, rating: "HIGH"}]
    }
  ]]);
  return {assessments};
}

export function createToolRegistry(repository) {
  const get = (user, id, permission = "assessment:read") => {
    const assessment = repository.assessments.get(id);
    assertAssessmentAccess(user, assessment, permission);
    return assessment;
  };
  const tools = {
    getAssessmentSummary: (args, user) => { const a = get(user, args.assessmentId); return {id:a.id, title:a.title, version:a.version, status:a.status}; },
    getRiskScores: (args, user) => get(user, args.assessmentId, "risk:read").riskScores,
    getRiskFactors: (args, user) => get(user, args.assessmentId, "risk:read").riskFactors,
    getControls: (args, user) => get(user, args.assessmentId, "risk:read").controls,
    getEvidence: (args, user) => get(user, args.assessmentId, "evidence:read").evidence,
    getApplicablePolicies: (args, user) => get(user, args.assessmentId, "policy:read").policies,
    getOverrides: (args, user) => get(user, args.assessmentId, "override:read").overrides,
    getJiraWorkItems: (args, user) => get(user, args.assessmentId, "jira:read:linked").jira,
    getConditions: (args, user) => get(user, args.assessmentId, "conditions:read").conditions,
    getAssessmentHistory: (args, user) => get(user, args.assessmentId).history
  };
  return {execute(name, args, user) { if (!tools[name]) throw new Error("UNKNOWN_TOOL"); return tools[name](args, user); }, names: () => Object.keys(tools)};
}

export function toolDefinitions(names) {
  return names.map(name => ({type: "function", name, description: `Read governed ${name} data for the active assessment.`, strict: true, parameters: {type:"object", properties:{assessmentId:{type:"string"}}, required:["assessmentId"], additionalProperties:false}}));
}
