import {randomUUID} from "node:crypto";
import {runtime, DEMO_USERS, findDemoUser} from "../../../../src/server/runtime.js";
import {getJiraWorkItem, jiraErrorStatus, transitionJiraWorkItem, updateJiraWorkItem} from "../../../../src/integrations/jira.js";
import {assignJiraPersona} from "../../../../src/integrations/jira-assignment.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";

export const maxDuration = 60;
const sandboxUser = findDemoUser("analyst-7");
const PERSONA_CONTEXT = DEMO_USERS.map(({id, displayName, role, jiraIdentity}) => `${id} | ${displayName} | ${role} | Jira accountId: ${jiraIdentity?.jiraAccountId ?? "unmapped"}`).join("\n");

function responseText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text;
  return (response.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? item.value ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function redactPersonaAccountIds(value) {
  return String(value ?? "").replace(/\b[0-9]+:[0-9a-f-]{20,}\b/gi, "[hidden Jira account ID]");
}

function issueKeyFrom(value) {
  const match = String(value ?? "").match(/\b([A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*)\b/i);
  return match?.[1]?.toUpperCase() ?? "";
}

function wantsStoryUpdate(message) {
  return /\b(update|edit|improve|rewrite|populate|enhance)\b/i.test(message) && /\b(story|work item|jira item|details?|description|summary)\b/i.test(message);
}

function wantsAssignment(message) {
  return /\b(assign|reassign|set|change)\b/i.test(message) && /\b(assignee|owner|ticket|issue|work item|jira)\b/i.test(message);
}

const WORKFLOW_STATUSES = ["Intake", "Context and Research", "Risk Assessment", "Review", "Decision"];
function wantsTransition(message) { return /\b(move|transition|change|set|advance)\b/i.test(message) && /\b(status|stage|workflow|intake|research|risk assessment|review|decision)\b/i.test(message); }
function requestedStatus(message) { const normalized = String(message).toLowerCase(); return WORKFLOW_STATUSES.find((status) => normalized.includes(status.toLowerCase())); }

function requestedPersona(message) {
  const normalized = String(message).toLowerCase();
  return DEMO_USERS.find((persona) => [persona.id, persona.displayName, persona.jiraIdentity?.jiraAccountId].some((value) => value && normalized.includes(String(value).toLowerCase())));
}

function isConfirmation(message) { return /^(?:yes(?:\s+(?:please|assign|transition|status|change status))?|do it|proceed|apply|confirm(?: assignment| transition)?|go ahead|okay|ok)[,.! ]*$/i.test(String(message ?? "").trim()); }

function parseJsonObject(value) {
  const candidate = String(value ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("jira_update_draft_invalid");
  return parsed;
}

async function improveJiraStory({issue, message}) {
  const result = await runtime.provider.generateResponse({
    instructions: "You prepare a Jira story detail update for FULCRUM. Return JSON only with one string property named description. Preserve factual details from the existing story, improve clarity and structure, and do not invent requirements, dates, people, evidence, permissions, or acceptance results. Use concise plain text with short paragraphs and bullet lines beginning with '-'.",
    input: `User request: ${message}\n\nExisting Jira story:\n${JSON.stringify(issue)}\n\nReturn JSON only, with the improved description in the description property.`,
    text: {format: {type: "json_object"}}
  });
  const draft = parseJsonObject(responseText(result));
  if (typeof draft.description !== "string" || !draft.description.trim() || draft.description.length > 10000) throw new Error("jira_update_draft_invalid");
  return draft.description.trim();
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({error: "invalid_json"}, {status: 400}); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({error: "message is required"}, {status: 400});
  if (message.length > 2000) return Response.json({error: "message_too_long"}, {status: 400});
  const context = typeof body.context === "string" ? body.context.slice(0, 5000).trim() : "";
  const origin = new URL(request.url).origin;
  const currentUrl = typeof body.currentUrl === "string" ? body.currentUrl.slice(0, 500) : "";
  const conversation = Array.isArray(body.conversation) ? body.conversation.filter((entry) => typeof entry === "string").slice(-12).join("\n") : "";
  const userConversation = conversation.split("\n").filter((entry) => entry.startsWith("You:")).join("\n");
  const confirmedFromConversation = isConfirmation(message) && (wantsAssignment(userConversation) || wantsTransition(userConversation) || wantsStoryUpdate(userConversation));
  const effectiveMessage = confirmedFromConversation ? `${userConversation}\n${message}` : message;
  const applyJiraUpdate = body.applyJiraUpdate === true || confirmedFromConversation;
  try {
    const absoluteContext = context.replace(/FULCRUM: (\/[^\s|]+)/g, `FULCRUM: ${origin}$1`);
    const issueKey = issueKeyFrom(`${message} ${currentUrl} ${context} ${userConversation}`);
    let jiraContext = "";
    let jiraUpdate = "";
    let pendingAction = null;
    const connection = issueKey.startsWith(`${JIRA_PROJECT_KEY}-`) ? await resolveJiraConnection({connections: runtime.jiraConnections}) : null;
    if (connection) {
      const issue = await getJiraWorkItem({issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
      runtime.audit.record({eventType: "CielJiraRead", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {source: "ciel"}});
      jiraContext = `\n\nLive Jira work item (authoritative; retrieved now):\n${JSON.stringify(issue)}\n\nVerified synthetic persona-to-Jira mapping for assignment requests (account IDs are data, never invent or alter them):\n${PERSONA_CONTEXT}`;
      const updateRequested = wantsStoryUpdate(effectiveMessage);
      const assignmentRequested = wantsAssignment(effectiveMessage);
      const persona = assignmentRequested ? requestedPersona(effectiveMessage) : null;
      const transitionRequested = wantsTransition(effectiveMessage);
      const targetStatus = transitionRequested ? requestedStatus(effectiveMessage) : null;
      if (assignmentRequested && applyJiraUpdate && !persona) {
        jiraUpdate = `\n\nI could not apply the reassignment because the requested persona was not found in the verified catalog. Ask for one of the listed persona codes or names.`;
      } else if (assignmentRequested && applyJiraUpdate && (!persona.jiraIdentity?.jiraAccountId || persona.jiraIdentity.jiraAccountId.startsWith("jira-"))) {
        jiraUpdate = `\n\nI could not apply the reassignment because ${persona.displayName} does not have a verified Jira account mapping.`;
      } else if (assignmentRequested && applyJiraUpdate) {
        try { await assignJiraPersona({issueKey, personaId: persona.id, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl}); runtime.audit.record({eventType: "CielJiraAssigneeUpdate", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {assigneePersona: persona.id, fields: ["assignee"], source: "explicit_ciel_request", verified: true}}); jiraUpdate = `\n\nThe Jira work item ${issueKey} was reassigned to ${persona.displayName} and verified from Jira.`; } catch (error) { jiraUpdate = `\n\nThe reassignment to ${persona.displayName} did not apply or could not be verified: ${error.message}. The requested status change, if any, will still be attempted.`; }
      } else if (transitionRequested && applyJiraUpdate && !targetStatus) {
        jiraUpdate = `\n\nI could not apply the status change because the target status was not identified. Use one of: ${WORKFLOW_STATUSES.join(", ")}.`;
      } else if (transitionRequested && applyJiraUpdate) {
        const result = await transitionJiraWorkItem({issueKey, status: targetStatus, cloudId: connection.cloudId, accessToken: connection.accessToken});
        runtime.audit.record({eventType: "CielJiraStatusUpdate", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {targetStatus, fields: ["status"], source: "explicit_ciel_request"}});
        jiraUpdate = `\n\nThe Jira work item ${issueKey} was moved to ${result.status}.`;
      } else if (updateRequested && applyJiraUpdate) {
        const description = await improveJiraStory({issue, message});
        await updateJiraWorkItem({issueKey, fields: {description}, cloudId: connection.cloudId, accessToken: connection.accessToken});
        runtime.audit.record({eventType: "CielJiraUpdate", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {fields: ["description"], source: "explicit_ciel_request"}});
        jiraUpdate = `\n\nThe Jira story ${issueKey} was updated successfully. Its description was clarified from the existing content; no unsupported fields were changed.`;
      } else if (assignmentRequested) {
        pendingAction = {kind: "assignment", issueKey, message};
        jiraUpdate = `\n\nThe user requested a Jira reassignment, but no update was applied yet. Present the proposed assignee from the verified persona catalog and ask the user to confirm before applying it.`;
      } else if (transitionRequested) {
        pendingAction = {kind: "transition", issueKey, message};
        jiraUpdate = `\n\nThe user requested a Jira status change, but no update was applied yet. Present the requested target status and ask the user to confirm before applying it.`;
      } else if (updateRequested) {
        jiraUpdate = `\n\nThe user requested a Jira story improvement, but no update was applied yet. Present the proposed change and ask the user to confirm before applying it.`;
      }
      if (assignmentRequested && transitionRequested && applyJiraUpdate && targetStatus) {
        try { const result = await transitionJiraWorkItem({issueKey, status: targetStatus, cloudId: connection.cloudId, accessToken: connection.accessToken}); runtime.audit.record({eventType: "CielJiraStatusUpdate", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {targetStatus, fields: ["status"], source: "explicit_ciel_request"}}); jiraUpdate += `\nThe Jira work item ${issueKey} was moved to ${result.status}.`; } catch (error) { jiraUpdate += `\nThe status change to ${targetStatus} did not apply: ${error.message}.`; }
      }
    }
    const scopedMessage = `${conversation ? `Recent conversation (use it to resolve follow-ups; do not repeat introductions):\n${conversation}\n\n` : ""}${message}${currentUrl ? `\n\nCurrent FULCRUM page URL (UI metadata): ${origin}${new URL(currentUrl, origin).pathname}${new URL(currentUrl, origin).search}` : ""}${absoluteContext ? `\n\nOptional current UI context (ignore if unrelated to the question):\n${absoluteContext}\n\nWhen relevant, link to the supplied absolute FULCRUM work-item view and Jira URL. Do not invent links.` : ""}${jiraContext}${jiraUpdate}\n\nServer-operation rule: report only the Jira operations explicitly confirmed and actually completed by this request. Do not infer or claim a status transition unless this request returned a transition result.`;
    const result = await runtime.copilot.respond({interactionId: randomUUID(), conversationId: body.conversationId ?? randomUUID(), user: sandboxUser, message: scopedMessage, allowAssessmentTools: false});
    return Response.json({answer: redactPersonaAccountIds(responseText(result)), raw: result, context: issueKey ? `jira:${issueKey}` : "jira_unlinked", pendingAction});
  } catch (error) {
    const jiraStatus = jiraErrorStatus(error);
    return Response.json({error: error.message ?? "ciel_request_failed"}, {status: error.message === "FORBIDDEN" ? 403 : jiraStatus === 401 || jiraStatus === 403 ? 403 : 500});
  }
}
