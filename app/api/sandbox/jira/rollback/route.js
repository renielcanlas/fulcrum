import {deleteJiraWorkItem, jiraErrorStatus} from "../../../../../src/integrations/jira.js";
import {runtime} from "../../../../../src/server/runtime.js";
import {resolveJiraConnection} from "../../../../../src/integrations/jira-connection.js";

export async function POST(request) {
  try {
    const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
    if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
    const body = await request.json();
    const issueKeys = [...new Set(Array.isArray(body.issueKeys) ? body.issueKeys : [])];
    if (!issueKeys.length) return Response.json({error: "rollback_issues_required"}, {status: 400});
    const results = [];
    for (const issueKey of issueKeys.reverse()) {
      const result = await deleteJiraWorkItem({issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken});
      runtime.audit.record({eventType: "SandboxJiraRollback", actorId: "fulcrum-sandbox", actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {reason: "failed_scenario_rollback"}});
      results.push(result);
    }
    return Response.json({ok: true, rolledBack: results.length, results});
  } catch (error) {
    const status = jiraErrorStatus(error) === 403 ? 403 : jiraErrorStatus(error) === 404 ? 404 : 502;
    return Response.json({error: error.message, hint: status === 403 ? "Rollback requires the service account's Jira Delete Issues permission." : undefined}, {status});
  }
}
