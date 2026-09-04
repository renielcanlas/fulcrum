import {
  commentJiraWorkItem,
  getJiraWorkItem,
  jiraErrorStatus,
  transitionJiraWorkItem,
} from "../../../../src/integrations/jira.js";
import {
  assessIntake,
  formatIntakeAssessmentComment,
  parsePublishedAssessments,
  parsePublishedIntakeAssessments,
} from "../../../../src/integrations/intake-assessment.js";
import {
  evaluationStages,
  evaluateStage,
  formatStageEvaluationComment,
  parsePublishedStageEvaluations,
} from "../../../../src/integrations/stage-evaluation.js";
import { runtime } from "../../../../src/server/runtime.js";
import { resolveJiraConnection } from "../../../../src/integrations/jira-connection.js";
const ACTOR = "fulcrum-bot";
async function load(request, issueKey) {
  const connection = await resolveJiraConnection({
    connections: runtime.jiraConnections,
  });
  if (!connection) throw new Error("jira_connection_required");
  const item = await getJiraWorkItem({
    issueKey,
    cloudId: connection.cloudId,
    accessToken: connection.accessToken,
    siteUrl: connection.siteUrl,
  });
  return { connection, item };
}
export async function GET(request) {
  try {
    const issueKey = new URL(request.url).searchParams
      .get("issue")
      ?.toUpperCase();
    const { item } = await load(request, issueKey);
    const allHistory = [
      ...parsePublishedAssessments(item.comments),
      ...evaluationStages.flatMap((stage) =>
        parsePublishedStageEvaluations(item.comments, stage),
      ),
    ].sort((left, right) =>
      String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? "")),
    );
    const history =
      item.statusName === "Intake"
        ? [
            ...parsePublishedIntakeAssessments(item.comments),
            ...parsePublishedStageEvaluations(item.comments, item.statusName),
          ]
        : parsePublishedStageEvaluations(item.comments, item.statusName);
    return Response.json({
      issueKey,
      stage: item.statusName,
      published: history[0] ?? null,
      history,
      allHistory,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: jiraErrorStatus(error) ?? 502 },
    );
  }
}
export async function POST(request) {
  let action;
  try {
    const body = await request.json();
    const issueKey = body.issueKey?.toUpperCase();
    action = body.action;
    const { connection, item } = await load(request, issueKey);
    const stage = body.stage ?? item.statusName;
    if (stage !== item.statusName)
      return Response.json(
        {
          error: "evaluation_requires_current_stage",
          stage: item.statusName,
        },
        { status: 409 },
      );
    if (!evaluationStages.includes(stage))
      return Response.json({ error: "unsupported_evaluation_stage", stage }, { status: 400 });
    const legacyHistory = stage === "Intake" ? parsePublishedIntakeAssessments(item.comments) : [];
    const history = [...legacyHistory, ...parsePublishedStageEvaluations(item.comments, stage)];
    const evaluate = () =>
      stage === "Intake" && !parsePublishedStageEvaluations(item.comments, stage).length
        ? assessIntake(item)
        : evaluateStage(item, stage);
    if (action === "assess")
      return Response.json({
        ok: true,
        assessment: { ...evaluate(), revision: history.length + 1 },
      });
    if (action === "publish") {
      const assessment = body.assessment ?? { ...evaluate(), revision: history.length + 1 };
      const result = await commentJiraWorkItem({
        issueKey,
        body: stage === "Intake" && !assessment.version?.startsWith("stage-")
          ? formatIntakeAssessmentComment(assessment)
          : formatStageEvaluationComment(assessment),
        cloudId: connection.cloudId,
        accessToken: connection.accessToken,
      });
      runtime.audit.record({
        eventType: "JiraStageEvaluationPublished",
        actorId: ACTOR,
        actorType: "SERVICE_ACCOUNT",
        userRole: "SERVICE_ACCOUNT",
        entityId: issueKey,
        metadata: {
          score: assessment.score,
          recommendation: assessment.recommendation,
          stage,
          revision: assessment.revision ?? null,
        },
      });
      return Response.json({ ok: true, ...result, assessment });
    }
    if (action === "transition") {
      if (!history.length)
        return Response.json(
          { error: "evaluation_required_before_transition", stage },
          { status: 409 },
        );
      const nextStages = {
        Intake: "Context and Research",
        "Context and Research": "Risk Assessment",
        "Risk Assessment": "Review",
        Review: "Decision",
      };
      const nextStage = nextStages[stage];
      if (!nextStage)
        return Response.json({ error: "no_next_stage", stage }, { status: 409 });
      const result = await transitionJiraWorkItem({
        issueKey,
        status: nextStage,
        cloudId: connection.cloudId,
        accessToken: connection.accessToken,
      });
      return Response.json({ ok: true, ...result });
    }
    return Response.json(
      { error: "unsupported_assessment_action" },
      { status: 400 },
    );
  } catch (error) {
    const status =
      jiraErrorStatus(error) ??
      (error.message.includes("requires") ? 409 : 502);
    return Response.json({ error: error.message }, { status });
  }
}
