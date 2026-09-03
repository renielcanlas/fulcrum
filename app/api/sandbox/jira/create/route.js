import {createJiraWorkItem} from "../../../../../src/integrations/jira.js";
import {runtime} from "../../../../../src/server/runtime.js";
import {parseCookie} from "../../../../../src/auth/session.js";
import {JIRA_PROJECT_KEY} from "../../../../../src/integrations/jira-config.js";

const cookieName = "fulcrum_session";

export async function POST(request) {
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  const connection = runtime.jiraConnections.get(user.id);
  if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
  try {
    const body = await request.json();
    const created = await createJiraWorkItem({...body, projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    runtime.audit.record({eventType: "SandboxJiraWorkItemCreated", actorId: user.id, actorType: "SANDBOX_GUEST", userRole: user.role, entityId: created.key, metadata: {projectKey: body.projectKey, summary: body.summary, issueType: body.issueType ?? "Task"}});
    return Response.json({mode: "live", ...created, url: `${connection.siteUrl.replace(/\/$/, "")}/browse/${created.key}`}, {status: 201});
  } catch (error) {
    const status = error.message.startsWith("invalid_") ? 400 : error.message === "jira_connection_required" ? 409 : 502;
    return Response.json({error: error.message}, {status});
  }
}
