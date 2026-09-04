import {runtime} from "../../../../src/server/runtime.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";
import {getJiraProjectPermissions} from "../../../../src/integrations/jira.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
    if (!connection) return Response.json({connected: false});
    const permissions = await getJiraProjectPermissions({projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    const ready = Boolean(permissions.BROWSE_PROJECTS?.havePermission && permissions.CREATE_ISSUES?.havePermission);
    return Response.json({connected: ready, authenticated: true, ready, mode: connection.mode ?? "oauth", siteName: connection.siteName, siteUrl: connection.siteUrl, cloudId: connection.cloudId, permissions, error: ready ? undefined : "jira_project_permissions_required"});
  } catch (error) {
    return Response.json({connected: false, error: error.message}, {status: 502});
  }
}
