import { assessIntake, formatIntakeAssessmentComment } from "../../../../../src/integrations/intake-assessment.js";
import { commentJiraWorkItem, getJiraWorkItem, jiraErrorStatus } from "../../../../../src/integrations/jira.js";
import { calculateWeightedIntakeDecision, generateIntakeDecisionSupport } from "../../../../../src/ai/intake-decision-support.js";
import { extractJiraPdfAttachments } from "../../../../../src/integrations/document-intelligence.js";
import { resolveJiraConnection } from "../../../../../src/integrations/jira-connection.js";
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
    if (!issueKey || body.stage !== "Intake") return Response.json({error: "intake_ai_evaluation_requires_intake_stage"}, {status: 400});
    const {connection, item} = await load(request, issueKey);
    const suppliedAssessment = body.action === "publish" && body.assessment && typeof body.assessment === "object" ? body.assessment : null;
    const assessment = suppliedAssessment ?? assessIntake(item);
    const attachmentEvidence = await extractJiraPdfAttachments({attachments: item.attachments ?? [], issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken});
    let decisionSupport;
    let aiError = null;
    if (assessment.aiDecisionSupport) {
      decisionSupport = assessment.aiDecisionSupport;
    } else {
      try {
        ({decisionSupport} = await generateIntakeDecisionSupport({provider: runtime.provider, item, assessment, attachmentEvidence}));
      } catch (error) {
        aiError = error.message ?? "intake_ai_review_failed";
        decisionSupport = {recommendation: assessment.recommendation, confidence: 0, summary: "AI decision support was unavailable; the deterministic intake metrics remain available for review.", challenge: "AI could not challenge the idea because the model was unavailable.", pros: [], cons: [], rationale: [], checkReviews: [], proposedComment: "", status: "unavailable"};
      }
    }
    const weightedDecision = decisionSupport.status === "unavailable"
      ? {score: 0, maxScore: assessment.maxScore, recommendation: "Hold for remediation", automaticPercent: 25, aiPercent: 75, status: "ai_unavailable"}
      : {...calculateWeightedIntakeDecision({automaticScore: assessment.score, aiScore: decisionSupport.score ?? 0, maxScore: assessment.maxScore}), status: decisionSupport.status};
    const enrichedAssessment = {
      ...assessment,
      decisionWeighting: {automaticPercent: weightedDecision.automaticPercent, aiPercent: weightedDecision.aiPercent},
      weightedDecision: {
        ...weightedDecision,
      },
      aiDecisionSupport: decisionSupport,
      aiContext: {commentCount: item.comments?.length ?? 0, attachmentCount: item.attachments?.length ?? 0, extractedAttachmentCount: attachmentEvidence.filter((evidence) => evidence.status === "completed").length, attachmentEvidence: attachmentEvidence.map((evidence) => ({attachmentId: evidence.attachmentId, filename: evidence.filename, status: evidence.status, reason: evidence.reason ?? null, pages: evidence.pages?.length ?? 0}))},
    };
    if (body.action === "publish") {
      if (!body.confirmed) return Response.json({error: "intake_ai_publish_confirmation_required"}, {status: 400});
      const result = await commentJiraWorkItem({issueKey, body: formatIntakeAssessmentComment(enrichedAssessment), cloudId: connection.cloudId, accessToken: connection.accessToken});
      return Response.json({ok: true, ...result, assessment: enrichedAssessment, attachmentEvidence: attachmentEvidence.map(({content, ...evidence}) => evidence), aiError});
    }
    return Response.json({ok: true, assessment: enrichedAssessment, attachmentEvidence: attachmentEvidence.map(({content, ...evidence}) => evidence), aiError});
  } catch (error) {
    return Response.json({error: error.message ?? "intake_ai_evaluation_failed"}, {status: jiraErrorStatus(error) ?? 502});
  }
}
