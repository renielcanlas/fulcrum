import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";

const cookieName = "fulcrum_session";

export const dynamic = "force-dynamic";

export function GET(request) {
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  const connection = runtime.jiraConnections.get(user.id);
  if (!connection) return Response.json({connected: false});
  return Response.json({connected: true, siteName: connection.siteName, siteUrl: connection.siteUrl, cloudId: connection.cloudId, expiresAt: connection.expiresAt});
}
