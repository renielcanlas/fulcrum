import {randomUUID} from "node:crypto";
import {runtime, findDemoUser} from "../../../../src/server/runtime.js";
import {getJiraWorkItem, jiraErrorStatus, updateJiraWorkItem} from "../../../../src/integrations/jira.js";
import {JIRA_PROJECT_KEY} from "../../../../src/integrations/jira-config.js";
import {resolveJiraConnection} from "../../../../src/integrations/jira-connection.js";

export const maxDuration = 60;
const sandboxUser = findDemoUser("analyst-7");

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

function issueKeyFrom(value) {
  const match = String(value ?? "").match(/\b([A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*)\b/i);
  return match?.[1]?.toUpperCase() ?? "";
}

function wantsStoryUpdate(message) {
  return /\b(update|edit|improve|rewrite|populate|enhance)\b/i.test(message) && /\b(story|work item|jira item|details?|description|summary)\b/i.test(message);
}

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
  try {
    const absoluteContext = context.replace(/FULCRUM: (\/[^\s|]+)/g, `FULCRUM: ${origin}$1`);
    const issueKey = issueKeyFrom(`${message} ${currentUrl} ${context}`);
    let jiraContext = "";
    let jiraUpdate = "";
    const connection = issueKey.startsWith(`${JIRA_PROJECT_KEY}-`) ? await resolveJiraConnection({connections: runtime.jiraConnections}) : null;
    if (connection) {
      const issue = await getJiraWorkItem({issueKey, cloudId: connection.cloudId, accessToken: connection.accessToken, siteUrl: connection.siteUrl});
      runtime.audit.record({eventType: "CielJiraRead", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {source: "ciel"}});
      jiraContext = `\n\nLive Jira work item (authoritative; retrieved now):\n${JSON.stringify(issue)}`;
      const updateRequested = wantsStoryUpdate(message);
      if (updateRequested && body.applyJiraUpdate === true) {
        const description = await improveJiraStory({issue, message});
        await updateJiraWorkItem({issueKey, fields: {description}, cloudId: connection.cloudId, accessToken: connection.accessToken});
        runtime.audit.record({eventType: "CielJiraUpdate", actorId: sandboxUser.id, actorType: "SANDBOX_SERVICE_ACCOUNT", userRole: "SERVICE_ACCOUNT", entityId: issueKey, metadata: {fields: ["description"], source: "explicit_ciel_request"}});
        jiraUpdate = `\n\nThe Jira story ${issueKey} was updated successfully. Its description was clarified from the existing content; no unsupported fields were changed.`;
      } else if (updateRequested) {
        jiraUpdate = `\n\nThe user requested a Jira story improvement, but no update was applied yet. Present the proposed change and ask the user to confirm before applying it.`;
      }
    }
    const scopedMessage = `${message}${currentUrl ? `\n\nCurrent FULCRUM page URL (UI metadata): ${origin}${new URL(currentUrl, origin).pathname}${new URL(currentUrl, origin).search}` : ""}${absoluteContext ? `\n\nOptional current UI context (ignore if unrelated to the question):\n${absoluteContext}\n\nWhen relevant, link to the supplied absolute FULCRUM work-item view and Jira URL. Do not invent links.` : ""}${jiraContext}${jiraUpdate}`;
    const result = await runtime.copilot.respond({interactionId: randomUUID(), conversationId: body.conversationId ?? randomUUID(), user: sandboxUser, message: scopedMessage, allowAssessmentTools: false});
    return Response.json({answer: responseText(result), raw: result, context: issueKey ? `jira:${issueKey}` : "jira_unlinked"});
  } catch (error) {
    const jiraStatus = jiraErrorStatus(error);
    return Response.json({error: error.message ?? "ciel_request_failed"}, {status: error.message === "FORBIDDEN" ? 403 : jiraStatus === 401 || jiraStatus === 403 ? 403 : 500});
  }
}
