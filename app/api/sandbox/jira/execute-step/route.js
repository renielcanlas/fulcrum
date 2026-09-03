import {createJiraWorkItem, transitionJiraWorkItem, updateJiraWorkItem} from "../../../../../src/integrations/jira.js";
import {runtime} from "../../../../../src/server/runtime.js";
import {parseCookie} from "../../../../../src/auth/session.js";

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
    if (step.action === "create") result = await createJiraWorkItem({...step, projectKey: "FCRM", cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "update") result = await updateJiraWorkItem({issueKey: body.issueKey, fields: step.fields, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "transition") result = await transitionJiraWorkItem({issueKey: body.issueKey, status: step.status, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "assign") result = await updateJiraWorkItem({issueKey: body.issueKey, fields: {assignee: {accountId: step.accountId}}, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else throw new Error("unsupported_scenario_action");
    runtime.audit.record({eventType: "SandboxJiraScenarioStep", actorId: user.id, actorType: "SANDBOX_GUEST", userRole: user.role, entityId: result.key ?? body.issueKey, metadata: {stepId: step.id, action: step.action}});
    return Response.json({ok: true, ...result, url: result.key ? `${connection.siteUrl.replace(/\/$/, "")}/browse/${result.key}` : undefined});
  } catch (error) {
    const status = error.message.startsWith("invalid_") || error.message === "unsupported_scenario_action" ? 400 : 502;
    return Response.json({error: error.message}, {status});
  }
}
