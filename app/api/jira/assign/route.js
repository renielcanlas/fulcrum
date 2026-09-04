import {jiraErrorStatus} from "../../../../src/integrations/jira.js";
import {assignJiraPersona} from "../../../../src/integrations/jira-assignment.js";
import {runtime} from "../../../../src/server/runtime.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
    if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
    const result = await assignJiraPersona({issueKey: body.issueKey?.toUpperCase(), personaId: body.personaId, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
    runtime.audit.record({eventType: "JiraAssigneeUpdated", actorId: "fulcrum-bot", actorType: "SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: result.issueKey, metadata: {personaId: result.personaId, verified: result.verified}});
    return Response.json({ok: true, ...result});
  } catch (error) {
    const statusCode = jiraErrorStatus(error);
    return Response.json({error: error.message, hint: error.message.startsWith("jira_assignment_not_verified") ? "Jira did not report the requested assignee after the update. Check Assign Issues permission and the persona account mapping." : undefined}, {status: statusCode ?? (error.message.startsWith("invalid_") ? 400 : 502)});
  }
}
