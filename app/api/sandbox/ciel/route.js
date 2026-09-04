import {randomUUID} from "node:crypto";
import {runtime, findDemoUser} from "../../../../src/server/runtime.js";

export const maxDuration = 60;
const assessmentId = "FA-2026-00124";
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

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({error: "invalid_json"}, {status: 400}); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({error: "message is required"}, {status: 400});
  if (message.length > 2000) return Response.json({error: "message_too_long"}, {status: 400});
  try {
    const result = await runtime.copilot.respond({interactionId: randomUUID(), conversationId: body.conversationId ?? randomUUID(), user: sandboxUser, assessmentId, message});
    return Response.json({answer: responseText(result), raw: result, context: "synthetic_demo_assessment"});
  } catch (error) {
    return Response.json({error: error.message ?? "ciel_request_failed"}, {status: error.message === "FORBIDDEN" ? 403 : 500});
  }
}
