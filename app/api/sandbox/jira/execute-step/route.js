import {commentJiraWorkItem, createJiraWorkItem, deleteAllJiraWorkItems, jiraErrorStatus, transitionJiraWorkItem, updateJiraWorkItem} from "../../../../../src/integrations/jira.js";
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
    const step = body.step ?? {};
    let result;
    if (step.action === "create") result = await createJiraWorkItem({...step, projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "update") result = await updateJiraWorkItem({issueKey: body.issueKey, fields: step.fields, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "transition") result = await transitionJiraWorkItem({issueKey: body.issueKey, status: step.status, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "assign") result = await updateJiraWorkItem({issueKey: body.issueKey, fields: {assignee: {accountId: step.accountId}}, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "comment") result = await commentJiraWorkItem({issueKey: body.issueKey, body: step.body, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "delete_all") result = await deleteAllJiraWorkItems({projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else throw new Error("unsupported_scenario_action");
    runtime.audit.record({eventType: "SandboxJiraScenarioStep", actorId: user.id, actorType: "SANDBOX_GUEST", userRole: user.role, entityId: result.key ?? body.issueKey, metadata: {stepId: step.id, action: step.action}});
    return Response.json({ok: true, ...result, url: result.key ? `${connection.siteUrl.replace(/\/$/, "")}/browse/${result.key}` : undefined});
  } catch (error) {
    const jiraStatus = jiraErrorStatus(error);
    const status = error.message.startsWith("invalid_") || error.message === "unsupported_scenario_action" ? 400 : jiraStatus === 401 || jiraStatus === 403 ? 403 : jiraStatus === 404 ? 404 : jiraStatus === 429 ? 429 : 502;
    const hint = jiraStatus === 403 ? "Jira denied this operation. Reconnect with the required scope and verify the Jira user's project permission." : jiraStatus === 404 ? "The Jira issue or endpoint was not found." : jiraStatus === 429 ? "Jira rate limit reached. Try again shortly." : error.message.startsWith("jira_transition_unavailable") ? "The requested status is not available from this issue's current workflow state. Use one of the statuses listed in the error." : undefined;
    return Response.json({error: error.message, hint}, {status});
  }
}
