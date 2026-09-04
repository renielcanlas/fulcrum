import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";

const cookieName = "fulcrum_session";

export const dynamic = "force-dynamic";

export function GET(request) {
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!user) return Response.json({authenticated: false, connected: false}, {status: 401});
  const connection = runtime.jiraConnections.get(user.id);
  return Response.json({authenticated: true, connected: Boolean(connection), mode: connection?.mode ?? "oauth", siteName: connection?.siteName, siteUrl: connection?.siteUrl});
}
