import {getJiraAttachment, jiraErrorStatus} from "../../../../src/integrations/jira.js";
import {runtime} from "../../../../src/server/runtime.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const issueKey = params.get("issue")?.toUpperCase() ?? "";
  const attachmentId = params.get("attachment") ?? "";
  const filename = params.get("filename") ?? "attachment";
  try {
    if (!issueKey.startsWith(`${JIRA_PROJECT_KEY}-`)) return Response.json({error: "invalid_project_key"}, {status: 400});
    const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
    if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
    const upstream = await getJiraAttachment({issueKey, attachmentId, cloudId: connection.cloudId, accessToken: connection.accessToken});
    const headers = new Headers();
    headers.set("cache-control", "private, no-store");
    const isPdf = /\.pdf$/i.test(filename);
    headers.set("content-type", isPdf ? "application/pdf" : upstream.headers.get("content-type") ?? "application/octet-stream");
    headers.set("content-disposition", `inline; filename="${filename.replace(/["\\\r\n]/g, "_")}"`);
    return new Response(upstream.body, {status: 200, headers});
  } catch (error) {
    const status = jiraErrorStatus(error) === 404 ? 404 : error.message === "invalid_jira_attachment_lookup" || error.message === "invalid_project_key" ? 400 : 502;
    return Response.json({error: error.message ?? "jira_attachment_failed"}, {status});
  }
}
