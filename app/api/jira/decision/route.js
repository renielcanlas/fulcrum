import { commentJiraWorkItem, getJiraWorkItem, jiraErrorStatus, transitionJiraWorkItem } from "../../../../src/integrations/jira.js";
import { parseCookie } from "../../../../src/auth/session.js";
import { findDemoUser, runtime } from "../../../../src/server/runtime.js";
import { resolveJiraConnection } from "../../../../src/integrations/jira-connection.js";
import { hasNonFulcrumChangesSinceEvaluation, parsePublishedStageEvaluations, publishedEvaluationRecommendation } from "../../../../src/integrations/stage-evaluation.js";
import { formatDecisionComment, parsePublishedDecisions, validateDecision } from "../../../../src/integrations/decision.js";

const COOKIE = "fulcrum_session";
function currentUser(request) {
  const sid = parseCookie(request.headers.get("cookie") ?? "", COOKIE);
  return runtime.sessions.get(sid) ?? (sid?.startsWith("demo:") ? findDemoUser(sid.slice("demo:".length)) : null);
}
async function load(issueKey) {
  const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
  if (!connection) throw new Error("jira_connection_required");
  const item = await getJiraWorkItem({issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
  return {connection, item};
}

export async function GET(request) {
  try {
    const issueKey = new URL(request.url).searchParams.get("issue")?.toUpperCase();
    const {item} = await load(issueKey);
    return Response.json({issueKey, stage: item.statusName, decisions: parsePublishedDecisions(item.comments)});
  } catch (error) {
    return Response.json({error: error.message}, {status: jiraErrorStatus(error) ?? 502});
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const issueKey = body.issueKey?.toUpperCase();
    const user = currentUser(request);
    if (!user) return Response.json({error: "fulcrum_session_required"}, {status: 401});
    if (user.role !== "RISK_COMMITTEE") return Response.json({error: "committee_decision_permission_required"}, {status: 403});
    if (!issueKey) return Response.json({error: "decision_issue_required"}, {status: 400});
    const {connection, item} = await load(issueKey);
    if (item.statusName !== "Review") return Response.json({error: "decision_requires_review_stage", stage: item.statusName}, {status: 409});
    const evaluations = parsePublishedStageEvaluations(item.comments, "Review");
    const evaluation = evaluations[0];
    if (!evaluation) return Response.json({error: "decision_evaluation_required"}, {status: 409});
    if (hasNonFulcrumChangesSinceEvaluation(item, evaluation)) return Response.json({error: "decision_evaluation_stale"}, {status: 409});
    if (publishedEvaluationRecommendation(evaluation) !== "Proceed") return Response.json({error: "decision_evaluation_not_ready", recommendation: publishedEvaluationRecommendation(evaluation)}, {status: 409});
    const decision = validateDecision(body.decision, {actorId: user.id, actorName: user.displayName, actorRole: user.role, evaluation});
    const result = await commentJiraWorkItem({issueKey, body: formatDecisionComment(decision), cloudId: connection.cloudId, accessToken: connection.accessToken});
    const targetStatus = decision.outcome === "ACCEPTED" ? "Accepted" : "Rejected";
    const transition = await transitionJiraWorkItem({issueKey, status: targetStatus, cloudId: connection.cloudId, accessToken: connection.accessToken});
    runtime.audit.record({eventType: "JiraHumanDecisionPublished", actorId: user.id, actorType: "DEMO_PERSONA", userRole: user.role, entityId: issueKey, metadata: {outcome: decision.outcome, weightedScore: decision.evaluation.weightedScore, jiraCommentId: result.commentId, targetStatus}});
    return Response.json({ok: true, ...result, ...transition, decision});
  } catch (error) {
    const validationError = ["decision_outcome_invalid", "decision_rationale_required", "decision_conditions_not_supported"].includes(error.message);
    return Response.json({error: error.message}, {status: jiraErrorStatus(error) ?? (validationError ? 400 : error.message.includes("required") || error.message.includes("stage") || error.message.includes("ready") || error.message.includes("stale") ? 409 : 502)});
  }
}
