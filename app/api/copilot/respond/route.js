import {randomUUID} from "node:crypto";
import {runtime, findDemoUser} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";

export const maxDuration = 60;
export async function POST(request) {
  // Ciel is intentionally available without a FULCRUM login in this synthetic demo.
  // A logged-in persona is still used when present; otherwise use the fixed demo analyst.
  const sessionId = parseCookie(request.headers.get("cookie") ?? "", "fulcrum_session");
  const user = runtime.sessions.get(sessionId) ?? findDemoUser("analyst-7");
  const body=await request.json(); if(!body.assessmentId || !body.message)return Response.json({error:"assessmentId and message are required"},{status:400});
  try { const result=await runtime.copilot.respond({interactionId:randomUUID(),conversationId:body.conversationId ?? randomUUID(),user,assessmentId:body.assessmentId,message:body.message}); return Response.json({answer:result.output_text ?? "",raw:result}); } catch(error) { return Response.json({error:error.message},{status:error.message === "FORBIDDEN" ? 403 : 500}); }
}
