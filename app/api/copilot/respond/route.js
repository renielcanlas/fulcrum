import {randomUUID} from "node:crypto";
import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";

export const maxDuration = 60;
const cookieName="fulcrum_session";
export async function POST(request) {
  const sessionId=parseCookie(request.headers.get("cookie") ?? "",cookieName); const user=runtime.sessions.get(sessionId); if(!user)return Response.json({error:"authentication_required"},{status:401});
  const body=await request.json(); if(!body.assessmentId || !body.message)return Response.json({error:"assessmentId and message are required"},{status:400});
  try { const result=await runtime.copilot.respond({interactionId:randomUUID(),conversationId:body.conversationId ?? randomUUID(),user,assessmentId:body.assessmentId,message:body.message}); return Response.json({answer:result.output_text ?? "",raw:result}); } catch(error) { return Response.json({error:error.message},{status:error.message === "FORBIDDEN" ? 403 : 500}); }
}
