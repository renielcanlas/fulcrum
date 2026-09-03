import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";

const cookieName = "fulcrum_session";
const sandboxUser = {id: "sandbox-guest", displayName: "Sandbox guest", role: "FCRM_ANALYST", sandbox: true};

function cookie(value) { return `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/${process.env.NODE_ENV === "production" ? "; Secure" : ""}; Max-Age=28800`; }

export async function POST(request) {
  const existing = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (existing) return Response.json({user: existing});
  const sessionId = runtime.sessions.create(sandboxUser);
  runtime.audit.record({eventType: "SandboxSessionStarted", actorId: sandboxUser.id, actorType: "SANDBOX_GUEST", userRole: sandboxUser.role, entityId: sandboxUser.id});
  return new Response(JSON.stringify({user: sandboxUser}), {headers: {"content-type": "application/json", "set-cookie": cookie(sessionId)}});
}
