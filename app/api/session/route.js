import {runtime, findDemoUser} from "../../../src/server/runtime.js";
import {parseCookie} from "../../../src/auth/session.js";

const cookieName="fulcrum_session";
function user(request) { const sid = parseCookie(request.headers.get("cookie") ?? "", cookieName); return runtime.sessions.get(sid) ?? (sid?.startsWith("demo:") ? findDemoUser(sid.slice("demo:".length)) : null); }
function cookie(value, maxAge) { return `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/${process.env.NODE_ENV === "production" ? "; Secure" : ""}; Max-Age=${maxAge}`; }
export function GET(request) { return Response.json({user:user(request)}, {headers:{"cache-control":"no-store"}}); }
export async function POST(request) { const body=await request.json(); const selected=findDemoUser(body.userId); if(!selected)return Response.json({error:"unknown_or_inactive_demo_user"},{status:400}); const sid=`demo:${selected.id}`; runtime.audit.record({eventType:"UserSessionStarted",actorId:selected.id,actorType:"DEMO_PERSONA",userRole:selected.role,entityId:selected.id}); return new Response(JSON.stringify({user:selected}),{headers:{"cache-control":"no-store","content-type":"application/json","set-cookie":cookie(sid,28800)}}); }
export function DELETE(request) { const sid=parseCookie(request.headers.get("cookie") ?? "",cookieName); const selected=user(request); runtime.jiraConnections.delete(sid); if(selected) runtime.jiraConnections.delete(selected.id); runtime.sessions.destroy(sid); if(selected)runtime.audit.record({eventType:"UserSessionEnded",actorId:selected.id,actorType:"DEMO_PERSONA",entityId:selected.id,metadata:{jiraUserConnectionRevoked:true}}); return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":cookie("",0)}}); }
