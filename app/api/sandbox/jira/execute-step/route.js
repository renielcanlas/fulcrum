import {commentJiraWorkItem, createJiraWorkItem, deleteAllJiraWorkItems, jiraErrorStatus, transitionJiraWorkItem, updateJiraWorkItem} from "../../../../../src/integrations/jira.js";
import {runtime} from "../../../../../src/server/runtime.js";
import {JIRA_PROJECT_KEY} from "../../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../../src/integrations/jira-connection.js";
import {findDemoUser} from "../../../../../src/auth/demo-users.js";

const SANDBOX_ACTOR_ID = "fulcrum-sandbox";
const ACTION_ALIASES = {create_issue: "create", add_comment: "comment", move: "transition", delete_all_issues: "delete_all"};

function normalizeStep(rawStep) {
  const actionKey = rawStep.action ?? Object.keys(rawStep).find((key) => ACTION_ALIASES[key] || ["create", "update", "transition", "assign", "comment", "delete_all"].includes(key));
  const action = ACTION_ALIASES[actionKey] ?? actionKey;
  const nested = rawStep[actionKey] && typeof rawStep[actionKey] === "object" && !Array.isArray(rawStep[actionKey]) ? rawStep[actionKey] : null;
  const step = nested ? {...rawStep, ...nested, action} : {...rawStep, action};
  if (action === "update" && !step.fields && nested) step.fields = nested;
  if (nested && actionKey !== "action") delete step[actionKey];
  return step;
}

function personaAccountId(personaId) {
  const persona = findDemoUser(personaId);
  if (!persona?.jiraIdentity?.jiraAccountId || persona.jiraIdentity.jiraAccountId.startsWith("jira-")) throw new Error("invalid_persona_jira_mapping");
  return persona.jiraIdentity.jiraAccountId;
}

export async function POST(request) {
  let action;
  try {
    const connection = await resolveJiraConnection({connections: runtime.jiraConnections});
    if (!connection) return Response.json({error: "jira_connection_required"}, {status: 409});
    const body = await request.json();
    const step = normalizeStep(body.step ?? {});
    action = step.action;
    let result;
    if (step.action === "create") result = await createJiraWorkItem({...step, projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "update") { const fields = {...(step.fields ?? {})}; if (fields.assigneePersona) { fields.assignee = {accountId: personaAccountId(fields.assigneePersona)}; delete fields.assigneePersona; } else if (fields.assignee?.personaId) fields.assignee = {accountId: personaAccountId(fields.assignee.personaId)}; result = await updateJiraWorkItem({issueKey: body.issueKey, fields, cloudId: connection.cloudId, accessToken: connection.accessToken}); }
    else if (step.action === "transition") result = await transitionJiraWorkItem({issueKey: body.issueKey, status: step.status ?? step.to ?? step.intent ?? step.targetStatus, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "assign") result = await updateJiraWorkItem({issueKey: body.issueKey, fields: {assignee: {accountId: step.personaId ? personaAccountId(step.personaId) : step.accountId}}, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "comment") result = await commentJiraWorkItem({issueKey: body.issueKey, body: step.body, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else if (step.action === "delete_all") result = await deleteAllJiraWorkItems({projectKey: JIRA_PROJECT_KEY, cloudId: connection.cloudId, accessToken: connection.accessToken});
    else throw new Error("unsupported_scenario_action");
    runtime.audit.record({eventType: "SandboxJiraScenarioStep", actorId: SANDBOX_ACTOR_ID, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: result.key ?? body.issueKey, metadata: {stepId: step.id, action: step.action}});
    return Response.json({ok: true, ...result, url: result.key ? `${connection.siteUrl.replace(/\/$/, "")}/browse/${result.key}` : undefined});
  } catch (error) {
    const jiraStatus = jiraErrorStatus(error);
    const status = error.message.startsWith("invalid_") || error.message === "unsupported_scenario_action" || jiraStatus === 400 ? 400 : jiraStatus === 401 || jiraStatus === 403 ? 403 : jiraStatus === 404 ? 404 : jiraStatus === 429 ? 429 : 502;
    const hint = jiraStatus === 403 && action === "delete_all" ? "Cleanup requires the service account to have the Jira project-level Delete Issues permission. Grant it temporarily for synthetic cleanup, or leave cleanup disabled under least privilege." : jiraStatus === 400 ? "Jira rejected the request payload. Check the issue type, field names, field values, and workflow configuration." : jiraStatus === 403 ? "Jira denied this operation. Verify the service account has the required Jira scope, product access, and FCRM project permission." : jiraStatus === 404 ? "The Jira issue or endpoint was not found." : jiraStatus === 429 ? "Jira rate limit reached. Try again shortly." : error.message === "fetch failed" ? "FULCRUM could not reach Jira. Check the deployment's network access and server-side Jira configuration, then retry." : error.message.startsWith("jira_transition_unavailable") ? "The requested status is not available from this issue's current workflow state. Use one of the statuses listed in the error." : undefined;
    return Response.json({error: error.message, hint}, {status});
  }
}
