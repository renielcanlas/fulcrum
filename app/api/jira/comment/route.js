import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {commentJiraWorkItem, jiraErrorStatus} from "../../../../src/integrations/jira.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";

const cookieName = "fulcrum_session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const sessionId = parseCookie(request.headers.get("cookie") ?? "", cookieName);
  const user = runtime.sessions.get(sessionId);
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  const connection = runtime.jiraConnections.get(sessionId);
  if (!connection) return Response.json({error: "jira_user_authorization_required"}, {status: 409});
  let body;
  try { body = await request.json(); } catch { return Response.json({error: "invalid_json"}, {status: 400}); }
  const issueKey = String(body.issueKey ?? "").toUpperCase();
  if (!issueKey.startsWith(`${JIRA_PROJECT_KEY}-`)) return Response.json({error: "invalid_jira_project"}, {status: 400});
  try {
    const result = await commentJiraWorkItem({issueKey, body: body.body, cloudId: connection.cloudId, accessToken: connection.accessToken});
    runtime.audit.record({eventType: "JiraCommentAdded", actorId: user.id, actorType: "DEMO_PERSONA", userRole: user.role, entityId: issueKey, metadata: {connection: "user_oauth"}});
    return Response.json({ok: true, ...result});
  } catch (error) {
    const statusCode = jiraErrorStatus(error);
    return Response.json({error: error.message ?? "jira_comment_failed"}, {status: statusCode === 401 ? 401 : statusCode === 403 ? 403 : statusCode === 400 ? 400 : 502});
  }
}
