import { assessIntake, formatIntakeAssessmentComment } from "../../../../../src/integrations/intake-assessment.js";
import { commentJiraWorkItem, getJiraWorkItem, jiraErrorStatus } from "../../../../../src/integrations/jira.js";
import { calculateWeightedEvaluationDecision, generateEvaluationDecisionSupport } from "../../../../../src/ai/intake-decision-support.js";
import { extractJiraPdfAttachments } from "../../../../../src/integrations/document-intelligence.js";
import { resolveJiraConnection } from "../../../../../src/integrations/jira-connection.js";
import { evaluationStages, evaluateStage, formatStageEvaluationComment, getStageEvaluationConfig } from "../../../../../src/integrations/stage-evaluation.js";
import { runtime } from "../../../../../src/server/runtime.js";

async function load(request, issueKey) {
  const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
  if (!connection) throw new Error("jira_connection_required");
  const item = await getJiraWorkItem({issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
  return {connection, item};
}

export async function POST(request) {
  try {
    const body = await request.json();
    const issueKey = body.issueKey?.toUpperCase();
    if (!issueKey) return Response.json({error: "evaluation_issue_required"}, {status: 400});
    const {connection, item} = await load(request, issueKey);
    const stage = body.stage ?? item.statusName;
    if (stage !== item.statusName) return Response.json({error: "evaluation_requires_current_stage", stage: item.statusName}, {status: 409});
    if (!evaluationStages.includes(stage)) return Response.json({error: "unsupported_evaluation_stage", stage}, {status: 400});
    const stageConfig = stage === "Intake" ? (getStageEvaluationConfig(stage) ?? {}) : getStageEvaluationConfig(stage);
    const suppliedAssessment = body.action === "publish" && body.assessment && typeof body.assessment === "object" ? body.assessment : null;
    const assessment = suppliedAssessment ?? (stage === "Intake" ? assessIntake(item) : evaluateStage(item, stage));
    const attachmentEvidence = await extractJiraPdfAttachments({attachments: item.attachments ?? [], issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken});
    let decisionSupport;
    let aiError = null;
    if (assessment.aiDecisionSupport) {
      decisionSupport = assessment.aiDecisionSupport;
    } else {
      try {
        ({decisionSupport} = await generateEvaluationDecisionSupport({provider: runtime.provider, item, assessment, attachmentEvidence, stage, stageConfig}));
      } catch (error) {
        aiError = error.message ?? "stage_ai_review_failed";
        decisionSupport = {recommendation: assessment.recommendation, confidence: 0, summary: "AI decision support was unavailable; the deterministic stage metrics remain available for review.", challenge: "AI could not challenge this stage because the model was unavailable.", pros: [], cons: [], rationale: [], checkReviews: [], proposedComment: "", status: "unavailable", stage};
      }
    }
    const weighting = stageConfig.decisionWeighting ?? {automaticPercent: 25, aiPercent: 75};
    const weightedDecision = decisionSupport.status === "unavailable"
      ? {score: 0, maxScore: assessment.maxScore, recommendation: "Hold for remediation", automaticPercent: weighting.automaticPercent, aiPercent: weighting.aiPercent, status: "ai_unavailable"}
      : {...calculateWeightedEvaluationDecision({automaticScore: assessment.score, aiScore: decisionSupport.score ?? 0, maxScore: assessment.maxScore, weighting, stageConfig}), status: decisionSupport.status};
    const enrichedAssessment = {
      ...assessment,
      stage,
      decisionWeighting: {automaticPercent: weightedDecision.automaticPercent, aiPercent: weightedDecision.aiPercent},
      weightedDecision: {
        ...weightedDecision,
      },
      aiDecisionSupport: decisionSupport,
      aiContext: {commentCount: item.comments?.length ?? 0, attachmentCount: item.attachments?.length ?? 0, extractedAttachmentCount: attachmentEvidence.filter((evidence) => evidence.status === "completed").length, attachmentEvidence: attachmentEvidence.map((evidence) => ({attachmentId: evidence.attachmentId, filename: evidence.filename, status: evidence.status, reason: evidence.reason ?? null, pages: evidence.pages?.length ?? 0}))},
    };
    if (body.action === "publish") {
      if (!body.confirmed) return Response.json({error: "stage_ai_publish_confirmation_required"}, {status: 400});
      const bodyText = stage === "Intake" ? formatIntakeAssessmentComment(enrichedAssessment) : formatStageEvaluationComment(enrichedAssessment);
      const result = await commentJiraWorkItem({issueKey, body: bodyText, cloudId: connection.cloudId, accessToken: connection.accessToken});
      return Response.json({ok: true, ...result, assessment: enrichedAssessment, attachmentEvidence: attachmentEvidence.map(({content, ...evidence}) => evidence), aiError});
    }
    return Response.json({ok: true, assessment: enrichedAssessment, attachmentEvidence: attachmentEvidence.map(({content, ...evidence}) => evidence), aiError});
  } catch (error) {
    return Response.json({error: error.message ?? "intake_ai_evaluation_failed"}, {status: jiraErrorStatus(error) ?? 502});
  }
}
