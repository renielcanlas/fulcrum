import {runtime as appRuntime} from "../../../src/server/runtime.js";
import {DEMO_USERS, findDemoUser} from "../../../src/auth/demo-users.js";
import {parseCookie} from "../../../src/auth/session.js";
import {demoPasswordHash, verifyPassword} from "../../../src/auth/password.js";

// This route reads cookies and uses the Node-backed demo session/audit stores.
// Keep it dynamic and out of edge/static execution so login never waits on a
// mismatched deployment runtime.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cookieName="fulcrum_session";
function sessionId(request) { return parseCookie(request.headers.get("cookie") ?? "", cookieName); }
async function user(request) { return appRuntime.sessions.getAsync(sessionId(request)); }
function cookie(value, maxAge) { return `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/;${process.env.NODE_ENV === "production" ? " Secure;" : ""} Max-Age=${maxAge}`; }
export async function GET(request) { return Response.json({user:await user(request)}, {headers:{"cache-control":"no-store"}}); }
export async function POST(request) {
  const previousSid = sessionId(request);
  const previousUser = await user(request);
  const previousLegacyUser = previousSid?.startsWith("demo:") ? findDemoUser(previousSid.slice("demo:".length)) : null;
  const body = await request.json().catch(() => ({}));
  const username = String(body.username ?? "").trim().toLowerCase();
  const selected = DEMO_USERS.find((candidate) => candidate.active && (candidate.id.toLowerCase() === username || candidate.email.toLowerCase() === username));
  if (!selected || !verifyPassword(body.password ?? "", demoPasswordHash())) return Response.json({error:"invalid_credentials"},{status:401});

  // A persona switch is a hard session boundary. OAuth connections are tied to
  // the browser session, so retaining either connection could make the next
  // persona act as the previous Atlassian user.
  if (previousSid) {
    appRuntime.jiraConnections.delete(previousSid);
    await appRuntime.sessions.destroyAsync(previousSid);
  }
  if (previousUser) appRuntime.jiraConnections.delete(previousUser.id);
  if (previousUser) appRuntime.jiraConnections.delete(`demo:${previousUser.id}`);
  if (previousLegacyUser) appRuntime.jiraConnections.delete(previousLegacyUser.id);
  if (previousLegacyUser) appRuntime.jiraConnections.delete(`demo:${previousLegacyUser.id}`);
  appRuntime.jiraConnections.delete(`demo:${selected.id}`);
  appRuntime.jiraConnections.delete(selected.id);

  const endedUser = previousUser || previousLegacyUser;
  if (endedUser && endedUser.id !== selected.id) {
    appRuntime.audit.record({eventType:"UserSessionEnded",actorId:endedUser.id,actorType:"DEMO_PERSONA",entityId:endedUser.id,metadata:{reason:"persona_switch",jiraUserConnectionRevoked:true}});
  }
  appRuntime.audit.record({eventType:"UserSessionStarted",actorId:selected.id,actorType:"DEMO_PERSONA",userRole:selected.role,entityId:selected.id,metadata:{reason:"persona_selected",previousPersonaId:previousUser?.id ?? null}});
  const sid = await appRuntime.sessions.createAsync(selected);
  return new Response(JSON.stringify({user:selected,sessionRefreshed:Boolean(previousUser)}),{headers:{"cache-control":"no-store","content-type":"application/json","set-cookie":cookie(sid,28800)}});
}
export async function DELETE(request) { const sid=sessionId(request); const selected=await user(request); appRuntime.jiraConnections.delete(sid); if(selected) appRuntime.jiraConnections.delete(selected.id); await appRuntime.sessions.destroyAsync(sid); if(selected)appRuntime.audit.record({eventType:"UserSessionEnded",actorId:selected.id,actorType:"DEMO_PERSONA",entityId:selected.id,metadata:{jiraUserConnectionRevoked:true}}); return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":cookie("",0)}}); }
