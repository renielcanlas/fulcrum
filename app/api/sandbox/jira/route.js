import {fetchJiraWorkItems} from "../../../../src/integrations/jira.js";
import {runtime} from "../../../../src/server/runtime.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";

const SANDBOX_ACTOR_ID = "fulcrum-sandbox";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const projectKey = JIRA_PROJECT_KEY;
  const extraJql = params.get("jql") ?? "";
  try {
    const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
    const result = await fetchJiraWorkItems({projectKey, extraJql, ...(connection ? {cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl} : {})});
    runtime.audit.record({eventType: "SandboxJiraSearch", actorId: SANDBOX_ACTOR_ID, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: projectKey, metadata: {mode: result.mode, jql: result.jql, resultCount: result.items.length}});
    return Response.json({...result, projectKey});
  } catch (error) {
    const status = error.message === "invalid_project_key" ? 400 : 502;
    return Response.json({error: error.message}, {status});
  }
}
