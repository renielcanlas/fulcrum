import {fetchJiraWorkItems} from "../../../../src/integrations/jira.js";
import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";

const cookieName = "fulcrum_session";

export async function GET(request) {
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  const params = new URL(request.url).searchParams;
  const projectKey = JIRA_PROJECT_KEY;
  const extraJql = params.get("jql") ?? "";
  try {
    const connection = runtime.jiraConnections.get(user.id);
    const result = await fetchJiraWorkItems({projectKey, extraJql, ...(connection ? {cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl} : {})});
    runtime.audit.record({eventType: "SandboxJiraSearch", actorId: user.id, actorType: "DEMO_PERSONA", userRole: user.role, entityId: projectKey, metadata: {mode: result.mode, jql: result.jql, resultCount: result.items.length}});
    return Response.json({...result, projectKey});
  } catch (error) {
    const status = error.message === "invalid_project_key" ? 400 : 502;
    return Response.json({error: error.message}, {status});
  }
}
