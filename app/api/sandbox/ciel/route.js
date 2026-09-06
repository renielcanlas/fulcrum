import {randomUUID} from "node:crypto";
import {runtime, DEMO_USERS, findDemoUser} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {getJiraWorkItem, jiraErrorStatus, transitionJiraWorkItem, updateJiraWorkItem} from "../../../../src/integrations/jira.js";
import {assignJiraPersona} from "../../../../src/integrations/jira-assignment.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";
import {fillActionResponse, planCielAction} from "../../../../src/ai/ciel-action-plan.js";
import {looksLikeAssignmentRequest, refersToCurrentUser} from "../../../../src/ai/ciel-intent.js";
import {cielDebug, cielDebugError} from "../../../../src/debug/ciel-debug.js";

export const maxDuration = 60;
const sandboxUser = findDemoUser("analyst-7");
const PERSONA_CONTEXT = DEMO_USERS.map(({id, displayName, role, jiraIdentity}) => `${id} | ${displayName} | ${role} | Jira accountId: ${jiraIdentity?.jiraAccountId ?? "unmapped"}`).join("\n");
const SESSION_COOKIE = "fulcrum_session";

function sessionUser(request) {
  const sid = parseCookie(request.headers.get("cookie") ?? "", SESSION_COOKIE);
  return runtime.sessions.get(sid) ?? (sid?.startsWith("demo:") ? findDemoUser(sid.slice("demo:".length)) : null);
}

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
  return looksLikeAssignmentRequest(message, (value) => Boolean(requestedPersona(value)));
}

const WORKFLOW_STATUSES = ["Intake", "Context and Research", "Risk Assessment", "Review", "Decision"];
function wantsTransition(message) { return /\b(move|transition|change|set|advance)\b/i.test(message) && /\b(status|stage|workflow|intake|research|risk assessment|review|decision)\b/i.test(message); }
function requestedStatus(message) { const normalized = String(message).toLowerCase(); return WORKFLOW_STATUSES.find((status) => normalized.includes(status.toLowerCase())); }

function requestedPersona(message) {
  const normalized = String(message).toLowerCase();
  return DEMO_USERS.find((persona) => [persona.id, persona.displayName, persona.jiraIdentity?.jiraAccountId].some((value) => value && normalized.includes(String(value).toLowerCase())));
}

function requestedPersonaValue(value) {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (!normalized) return null;
  return DEMO_USERS.find((persona) => [persona.id, persona.displayName, persona.jiraIdentity?.jiraAccountId].some((candidate) => candidate && String(candidate).toLowerCase() === normalized))
    ?? requestedPersona(normalized);
}

function isConfirmation(message) { return /^(?:yes(?:\s+(?:please|assign|transition|status|change status))?|do it|proceed|apply|confirm(?: assignment| transition)?|go ahead|okay|ok)[,.! ]*$/i.test(String(message ?? "").trim()); }

function parseJsonObject(value) {
  const candidate = String(value ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("jira_update_draft_invalid");
  return parsed;
}

async function improveJiraStory({issue, message, onAzureRequest, onAzureResponse}) {
  onAzureRequest?.();
  const result = await runtime.provider.generateResponse({
    instructions: "You prepare a Jira story detail update for FULCRUM. Return JSON only with one string property named description. Preserve factual details from the existing story, improve clarity and structure, and do not invent requirements, dates, people, evidence, permissions, or acceptance results. Use concise plain text with short paragraphs and bullet lines beginning with '-'.",
    input: `User request: ${message}\n\nExisting Jira story:\n${JSON.stringify(issue)}\n\nReturn JSON only, with the improved description in the description property.`,
    text: {format: {type: "json_object"}}
  });
  onAzureResponse?.(result);
  const draft = parseJsonObject(responseText(result));
  if (typeof draft.description !== "string" || !draft.description.trim() || draft.description.length > 10000) throw new Error("jira_update_draft_invalid");
  return draft.description.trim();
}

export async function POST(request) {
  const actingUser = sessionUser(request) ?? sandboxUser;
  let body;
  try { body = await request.json(); } catch { return Response.json({error: "invalid_json"}, {status: 400}); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({error: "message is required"}, {status: 400});
  if (message.length > 2000) return Response.json({error: "message_too_long"}, {status: 400});
  cielDebug("Ciel receives request", message);
  const context = typeof body.context === "string" ? body.context.slice(0, 5000).trim() : "";
  const origin = new URL(request.url).origin;
  const currentUrl = typeof body.currentUrl === "string" ? body.currentUrl.slice(0, 500) : "";
  const conversation = Array.isArray(body.conversation) ? body.conversation.filter((entry) => typeof entry === "string").slice(-12).join("\n") : "";
  const recentConversation = conversation.split("\n").slice(-8).join("\n");
  const userConversation = recentConversation.split("\n").filter((entry) => entry.startsWith("You:")).join("\n");
  const confirmedFromConversation = isConfirmation(message) && (wantsAssignment(userConversation) || wantsTransition(userConversation) || wantsStoryUpdate(userConversation));
  const effectiveMessage = confirmedFromConversation ? `${userConversation}\n${message}` : message;
  const applyJiraUpdate = body.applyJiraUpdate === true || confirmedFromConversation;
  try {
    const absoluteContext = context.replace(/FULCRUM: (\/[^\s|]+)/g, `FULCRUM: ${origin}$1`);
    const issueKey = issueKeyFrom(`${message} ${currentUrl} ${context} ${userConversation}`);
    let jiraContext = "";
    let jiraUpdate = "";
    let pendingAction = null;
    let actionPlan = null;
    let operationOutcome = null;
    const connection = issueKey.startsWith(`${JIRA_PROJECT_KEY}-`) ? await resolveJiraConnection({connections: runtime.jiraConnections}) : null;
    if (connection) {
      const issue = await getJiraWorkItem({issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
      runtime.audit.record({eventType: "CielJiraRead", actorId: actingUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: actingUser.role, entityId: issueKey, metadata: {source: "ciel"}});
      jiraContext = `\n\nLive Jira work item (authoritative; retrieved now):\n${JSON.stringify(issue)}`;
      const heuristicUpdateRequested = wantsStoryUpdate(effectiveMessage);
      const heuristicAssignmentRequested = wantsAssignment(effectiveMessage);
      const heuristicTransitionRequested = wantsTransition(effectiveMessage);
      const actionRequested = heuristicUpdateRequested || heuristicAssignmentRequested || heuristicTransitionRequested;
      if (actionRequested) {
        try {
          cielDebug("Ciel sent the message to Azure");
          actionPlan = await planCielAction({provider: runtime.provider, message: effectiveMessage, conversation: recentConversation, issue, personaContext: heuristicAssignmentRequested ? PERSONA_CONTEXT : "", currentUrl, currentUserContext: `${actingUser.id} | ${actingUser.displayName} | ${actingUser.role}`, onAzureResponse: (response) => cielDebug("actual Azure response", response)});
        } catch {
          try {
            cielDebug("Ciel sent the message to Azure");
            actionPlan = await planCielAction({provider: runtime.provider, message: effectiveMessage, conversation: recentConversation, issue, personaContext: heuristicAssignmentRequested ? PERSONA_CONTEXT : "", currentUrl, currentUserContext: `${actingUser.id} | ${actingUser.displayName} | ${actingUser.role}`, planningNote: "The previous response was invalid or incomplete. Return the required JSON object only, with one supported intent and a concise responsePlan.", onAzureResponse: (response) => cielDebug("actual Azure response", response)});
          } catch {
            actionPlan = null;
          }
        }
      }
      if (heuristicAssignmentRequested) jiraContext += `\n\nVerified synthetic persona-to-Jira mapping for this assignment request (account IDs are data, never invent or alter them):\n${PERSONA_CONTEXT}`;
      const updateRequested = actionPlan?.intent === "jira_update" || heuristicUpdateRequested;
      const assignmentRequested = actionPlan?.intent === "jira_assign" || heuristicAssignmentRequested;
      const transitionRequested = actionPlan?.intent === "jira_transition" || heuristicTransitionRequested;
      const explicitPersona = requestedPersona(message) ?? requestedPersona(effectiveMessage);
      let persona = assignmentRequested ? (refersToCurrentUser(effectiveMessage) ? actingUser : explicitPersona ?? requestedPersonaValue(actionPlan?.assigneePersona)) : null;
      const targetStatus = transitionRequested ? (actionPlan?.targetStatus || requestedStatus(effectiveMessage)) : null;
      if (assignmentRequested && !persona && actionPlan) {
        try {
          cielDebug("Ciel sent the message to Azure");
          actionPlan = await planCielAction({
            provider: runtime.provider,
            message: effectiveMessage,
            conversation: recentConversation,
            issue,
            personaContext: PERSONA_CONTEXT,
            currentUrl,
            currentUserContext: `${actingUser.id} | ${actingUser.displayName} | ${actingUser.role}`,
            planningNote: "The previous plan did not resolve a valid assignee. Select exactly one persona from the verified catalog, or leave assigneePersona empty if the user did not specify one. Do not guess.",
            onAzureResponse: (response) => cielDebug("actual Azure response", response)
          });
          persona = refersToCurrentUser(effectiveMessage) ? actingUser : explicitPersona ?? requestedPersonaValue(actionPlan.assigneePersona);
        } catch {
          actionPlan = null;
        }
      }
      const usePreparedActionResponse = Boolean(actionPlan && actionPlan.intent !== "none" && actionPlan.responsePlan.pending && actionPlan.responsePlan.success && actionPlan.responsePlan.failure);
      const responseValues = () => ({issueKey, assignee: persona?.displayName ?? actionPlan?.assigneePersona ?? "the requested persona", targetStatus: targetStatus ?? "the requested status"});
      if (actionRequested || actionPlan?.intent && actionPlan.intent !== "none") {
        cielDebug("Ciel action selected after Azure response", {
          azureIntent: actionPlan?.intent ?? "unavailable",
          backendAction: assignmentRequested ? "jira_assign" : transitionRequested ? "jira_transition" : updateRequested ? "jira_update" : "none",
          issueKey,
          assignee: persona?.displayName ?? null,
          targetStatus,
          confirmed: applyJiraUpdate,
          planningFallback: !actionPlan
        });
      }
      if (assignmentRequested && applyJiraUpdate && !persona) {
        jiraUpdate = `\n\nI could not apply the reassignment because the requested persona was not found in the verified catalog. Ask for one of the listed persona codes or names.`;
        operationOutcome = {success: false, reason: "The requested persona was not found in the verified catalog."};
      } else if (assignmentRequested && applyJiraUpdate && (!persona.jiraIdentity?.jiraAccountId || persona.jiraIdentity.jiraAccountId.startsWith("jira-"))) {
        jiraUpdate = `\n\nI could not apply the reassignment because ${persona.displayName} does not have a verified Jira account mapping.`;
        operationOutcome = {success: false, reason: `${persona.displayName} does not have a verified Jira account mapping.`};
      } else if (assignmentRequested && applyJiraUpdate) {
        cielDebug("Ciel action started", {type: "jira_assign", issueKey, target: persona.displayName});
        try { const result = await assignJiraPersona({issueKey, personaId: persona.id, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl}); runtime.audit.record({eventType: "CielJiraAssigneeUpdate", actorId: actingUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: actingUser.role, entityId: issueKey, metadata: {assigneePersona: persona.id, fields: ["assignee"], source: "explicit_ciel_request", verified: true}}); operationOutcome = {success: true, assignee: result.assignee}; jiraUpdate = `\n\nThe Jira work item ${issueKey} was reassigned to ${persona.displayName} and verified from Jira.`; } catch (error) { operationOutcome = {success: false, reason: error.message}; jiraUpdate = `\n\nThe reassignment to ${persona.displayName} did not apply or could not be verified: ${error.message}. The requested status change, if any, will still be attempted.`; }
      } else if (transitionRequested && applyJiraUpdate && !targetStatus) {
        jiraUpdate = `\n\nI could not apply the status change because the target status was not identified. Use one of: ${WORKFLOW_STATUSES.join(", ")}.`;
        operationOutcome = {success: false, reason: "The target status was not identified."};
      } else if (transitionRequested && applyJiraUpdate) {
        cielDebug("Ciel action started", {type: "jira_transition", issueKey, target: targetStatus});
        try { const result = await transitionJiraWorkItem({issueKey, status: targetStatus, cloudId: connection.cloudId, accessToken: connection.accessToken}); runtime.audit.record({eventType: "CielJiraStatusUpdate", actorId: actingUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: actingUser.role, entityId: issueKey, metadata: {targetStatus, fields: ["status"], source: "explicit_ciel_request"}}); operationOutcome = {success: true, targetStatus: result.status}; jiraUpdate = `\n\nThe Jira work item ${issueKey} was moved to ${result.status}.`; } catch (error) { operationOutcome = {success: false, reason: error.message}; jiraUpdate = `\n\nThe status change to ${targetStatus} did not apply: ${error.message}.`; }
      } else if (updateRequested && applyJiraUpdate) {
        cielDebug("Ciel action started", {type: "jira_update", issueKey, fields: ["description"]});
        try { const description = await improveJiraStory({issue, message, onAzureRequest: () => cielDebug("Ciel sent the message to Azure"), onAzureResponse: (response) => cielDebug("actual Azure response", response)}); await updateJiraWorkItem({issueKey, fields: {description}, cloudId: connection.cloudId, accessToken: connection.accessToken}); runtime.audit.record({eventType: "CielJiraUpdate", actorId: actingUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: actingUser.role, entityId: issueKey, metadata: {fields: ["description"], source: "explicit_ciel_request"}}); operationOutcome = {success: true}; jiraUpdate = `\n\nThe Jira story ${issueKey} was updated successfully. Its description was clarified from the existing content; no unsupported fields were changed.`; } catch (error) { operationOutcome = {success: false, reason: error.message}; jiraUpdate = `\n\nThe Jira story ${issueKey} was not updated: ${error.message}.`; }
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
        cielDebug("Ciel action started", {type: "jira_transition", issueKey, target: targetStatus});
        try { const result = await transitionJiraWorkItem({issueKey, status: targetStatus, cloudId: connection.cloudId, accessToken: connection.accessToken}); runtime.audit.record({eventType: "CielJiraStatusUpdate", actorId: actingUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: actingUser.role, entityId: issueKey, metadata: {targetStatus, fields: ["status"], source: "explicit_ciel_request"}}); operationOutcome = {...operationOutcome, success: operationOutcome?.success !== false, targetStatus: result.status}; jiraUpdate += `\nThe Jira work item ${issueKey} was moved to ${result.status}.`; } catch (error) { operationOutcome = {...operationOutcome, success: false, reason: error.message}; jiraUpdate += `\nThe status change to ${targetStatus} did not apply: ${error.message}.`; }
      }
      if (assignmentRequested && transitionRequested && applyJiraUpdate && operationOutcome?.success && actionPlan) operationOutcome.success = true;
      if (usePreparedActionResponse && !applyJiraUpdate) jiraUpdate = `\n\n${fillActionResponse(actionPlan.responsePlan.pending, responseValues())}`;
      if (usePreparedActionResponse && applyJiraUpdate) jiraUpdate = `\n\n${fillActionResponse(operationOutcome?.success ? actionPlan.responsePlan.success : actionPlan.responsePlan.failure, {...responseValues(), reason: operationOutcome?.reason ?? "The Jira operation was not verified."})}`;
      if (assignmentRequested && !applyJiraUpdate) pendingAction = {kind: "assignment", issueKey, message, responsePlan: actionPlan?.responsePlan ?? null};
      else if (transitionRequested && !applyJiraUpdate) pendingAction = {kind: "transition", issueKey, message, responsePlan: actionPlan?.responsePlan ?? null};
    }
    const scopedMessage = `Current Fulcrum user: ${actingUser.id} | ${actingUser.displayName} | ${actingUser.role}. Interpret "me" or "myself" as this user only.\n\n${recentConversation ? `Recent conversation (use it to resolve follow-ups; do not repeat introductions):\n${recentConversation}\n\n` : ""}${message}${currentUrl ? `\n\nCurrent FULCRUM page URL (UI metadata): ${origin}${new URL(currentUrl, origin).pathname}${new URL(currentUrl, origin).search}` : ""}${absoluteContext ? `\n\nOptional current UI context (ignore if unrelated to the question):\n${absoluteContext}\n\nWhen relevant, link to the supplied absolute FULCRUM work-item view and Jira URL. Do not invent links.` : ""}${jiraContext}${jiraUpdate}\n\nServer-operation rule: report only the Jira operations explicitly confirmed and actually completed by this request. Do not infer or claim a status transition unless this request returned a transition result.`;
    if (actionPlan?.intent && actionPlan.intent !== "none" && actionPlan.responsePlan.pending && actionPlan.responsePlan.success && actionPlan.responsePlan.failure) {
      const answer = redactPersonaAccountIds(jiraUpdate.trim() || actionPlan.responsePlan.pending);
      cielDebug("Ciel action result", operationOutcome ?? {success: false, reason: "not executed"});
      cielDebug("response given back to user", answer);
      return Response.json({answer, raw: null, responseId: null, context: issueKey ? `jira:${issueKey}` : "jira_unlinked", pendingAction, actionPlan: {intent: actionPlan.intent, confidence: actionPlan.confidence, requiresConfirmation: actionPlan.requiresConfirmation}, operationOutcome});
    }
    cielDebug("Ciel sent the message to Azure");
    const result = await runtime.copilot.respond({interactionId: randomUUID(), conversationId: body.conversationId ?? randomUUID(), previousResponseId: body.previousResponseId, user: actingUser, message: scopedMessage, allowAssessmentTools: false});
    const answer = redactPersonaAccountIds(responseText(result));
    cielDebug("actual Azure response", result);
    cielDebug("response given back to user", answer);
    return Response.json({answer, raw: result, responseId: result.id ?? null, context: issueKey ? `jira:${issueKey}` : "jira_unlinked", pendingAction});
  } catch (error) {
    cielDebugError(error);
    const jiraStatus = jiraErrorStatus(error);
    return Response.json({error: error.message ?? "ciel_request_failed"}, {status: error.message === "FORBIDDEN" ? 403 : jiraStatus === 401 || jiraStatus === 403 ? 403 : 500});
  }
}
