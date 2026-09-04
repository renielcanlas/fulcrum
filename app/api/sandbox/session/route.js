import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";

const cookieName = "fulcrum_session";

export async function POST(request) {
  const existing = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!existing) return Response.json({error: "authentication_required"}, {status: 401});
  return Response.json({user: existing});
}
