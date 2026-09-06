import {runtime, findDemoUser} from "../../../../../src/server/runtime.js";
import {parseCookie} from "../../../../../src/auth/session.js";
import {uploadJiraAttachment, jiraErrorStatus} from "../../../../../src/integrations/jira.js";
import {JIRA_PROJECT_KEY} from "../../../../../src/integrations/jira-config.js";

const cookieName = "fulcrum_session";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request) {
  const sessionId = parseCookie(request.headers.get("cookie") ?? "", cookieName);
  const user = runtime.sessions.get(sessionId) ?? (sessionId?.startsWith("demo:") ? findDemoUser(sessionId.slice("demo:".length)) : null);
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  const connection = runtime.jiraConnections.get(sessionId);
  if (!connection) return Response.json({error: "jira_user_authorization_required"}, {status: 409});
  try {
    const form = await request.formData();
    const issueKey = String(form.get("issueKey") ?? "").toUpperCase();
    const file = form.get("file");
    if (!issueKey.startsWith(`${JIRA_PROJECT_KEY}-`)) return Response.json({error: "invalid_jira_project"}, {status: 400});
    if (!file || typeof file.arrayBuffer !== "function" || !file.name) return Response.json({error: "attachment_file_required"}, {status: 400});
    if (file.size > MAX_ATTACHMENT_BYTES) return Response.json({error: "attachment_too_large", maxBytes: MAX_ATTACHMENT_BYTES}, {status: 413});
    const result = await uploadJiraAttachment({issueKey, file, cloudId: connection.cloudId, accessToken: connection.accessToken});
    runtime.audit.record({eventType: "JiraAttachmentUploaded", actorId: user.id, actorType: "DEMO_PERSONA", userRole: user.role, entityId: issueKey, metadata: {connection: "user_oauth", filename: file.name, size: file.size, mimeType: file.type || "application/octet-stream"}});
    return Response.json({ok: true, ...result});
  } catch (error) {
    const statusCode = jiraErrorStatus(error);
    return Response.json({error: error.message ?? "jira_attachment_upload_failed"}, {status: statusCode === 401 ? 401 : statusCode === 403 ? 403 : statusCode === 413 ? 413 : statusCode === 400 ? 400 : 502});
  }
}
