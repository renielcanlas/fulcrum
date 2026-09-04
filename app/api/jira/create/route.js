import {createJiraWorkItem} from "../../../../src/integrations/jira.js";
import {jiraErrorStatus} from "../../../../src/integrations/jira.js";
import {runtime} from "../../../../src/server/runtime.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";

const SANDBOX_ACTOR_ID = "fulcrum-sandbox";

export async function POST(request) {
  const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
  if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
  try {
    const body = await request.json();
    const created = await createJiraWorkItem({...body, projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    runtime.audit.record({eventType: "SandboxJiraWorkItemCreated", actorId: SANDBOX_ACTOR_ID, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: created.key, metadata: {projectKey: body.projectKey, summary: body.summary, issueType: body.issueType ?? "Task"}});
    return Response.json({mode: "live", ...created, url: `${connection.siteUrl.replace(/\/$/, "")}/browse/${created.key}`}, {status: 201});
  } catch (error) {
    const jiraStatus = jiraErrorStatus(error);
    const status = error.message.startsWith("invalid_") || jiraStatus === 400 ? 400 : error.message === "jira_connection_required" ? 409 : jiraStatus === 401 || jiraStatus === 403 ? 403 : 502;
    const hint = jiraStatus === 400 || jiraStatus === 403 ? "Jira denied creation. Verify the service account has Jira product access, Create Issues permission, and the required write scope for FCRM." : undefined;
    return Response.json({error: error.message, hint}, {status});
  }
}
