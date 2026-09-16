import {runtime as appRuntime} from "../../../src/server/runtime.js";
import {parseCookie} from "../../../src/auth/session.js";
import {assertCapability} from "../../../src/auth/authorization.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const cookieName = "fulcrum_session";

async function currentUser(request) {
  return appRuntime.sessions.getAsync(parseCookie(request.headers.get("cookie") ?? "", cookieName));
}

export async function GET(request) {
  const user = await currentUser(request);
  if (!user) return Response.json({error:"authentication_required"}, {status:401});
  try { assertCapability(user, "configuration:manage"); } catch { return Response.json({error:"forbidden"}, {status:403}); }
  return Response.json({configuration: await appRuntime.configuration.getAll()}, {headers:{"cache-control":"no-store"}});
}

export async function PUT(request) {
  const user = await currentUser(request);
  if (!user) return Response.json({error:"authentication_required"}, {status:401});
  try { assertCapability(user, "configuration:manage"); } catch { return Response.json({error:"forbidden"}, {status:403}); }
  const body = await request.json().catch(() => ({}));
  try {
    const saved = await appRuntime.configuration.set(body.section, body.values, user.id);
    appRuntime.audit.record({eventType:"ConfigurationUpdated", actorId:user.id, actorType:"DEMO_PERSONA", userRole:user.role, entityId:body.section, metadata:{version:saved.version, section:body.section}});
    return Response.json({section:body.section, ...saved}, {headers:{"cache-control":"no-store"}});
  } catch (error) {
    return Response.json({error:error.message ?? "invalid_configuration"}, {status:400});
  }
}
