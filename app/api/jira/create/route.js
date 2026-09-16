import {createJiraWorkItem, getJiraWorkItem, jiraErrorStatus} from "../../../../src/integrations/jira.js";
import {runtime} from "../../../../src/server/runtime.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";
import {DEMO_USERS} from "../../../../src/auth/demo-users.js";

const SANDBOX_ACTOR_ID = "fulcrum-sandbox";

export async function POST(request) {
  const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
  if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
  try {
    const body = await request.json();
    const ownerName = typeof body.owner === "string" ? body.owner.trim() : "";
    const ownerPersona = ownerName ? DEMO_USERS.find((persona) => persona.displayName === ownerName) : null;
    if (ownerName && !ownerPersona) return Response.json({error: "invalid_accountable_owner"}, {status: 400});
    const created = await createJiraWorkItem({...body, projectKey: JIRA_PROJECT_KEY, assigneeAccountId: ownerPersona?.jiraIdentity?.jiraAccountId ?? null, cloudId: connection.cloudId, accessToken: connection.accessToken});
    let verifiedOwner = null;
    if (ownerPersona) {
      let verified = await getJiraWorkItem({issueKey: created.key, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
      verifiedOwner = verified.assigneeAccountId === ownerPersona.jiraIdentity.jiraAccountId;
      if (!verifiedOwner) throw new Error(`jira_owner_not_persisted: expected ${ownerPersona.displayName}, Jira returned ${verified.assignee ?? "Unassigned"}`);
    }
    runtime.audit.record({eventType: "SandboxJiraWorkItemCreated", actorId: SANDBOX_ACTOR_ID, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: created.key, metadata: {projectKey: body.projectKey, summary: body.summary, issueType: body.issueType ?? "Task", accountableOwner: ownerPersona?.displayName ?? null, accountableOwnerVerified: verifiedOwner}});
    return Response.json({mode: "live", ...created, accountableOwner: ownerPersona?.displayName ?? null, accountableOwnerVerified: verifiedOwner, url: `${connection.siteUrl.replace(/\/$/, "")}/browse/${created.key}`}, {status: 201});
  } catch (error) {
    const jiraStatus = jiraErrorStatus(error);
    const status = error.message.startsWith("invalid_") || jiraStatus === 400 ? 400 : error.message === "jira_connection_required" ? 409 : jiraStatus === 401 || jiraStatus === 403 ? 403 : 502;
    const hint = jiraStatus === 400 || jiraStatus === 403 ? "Jira denied creation. Verify the service account has Jira product access, Create Issues permission, and the required write scope for FCRM." : undefined;
    return Response.json({error: error.message, hint}, {status});
  }
}
