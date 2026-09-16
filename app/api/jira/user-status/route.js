import {runtime, findDemoUser} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {getGuidedDemoConnection} from "../../../../src/integrations/jira-oauth.js";

const cookieName = "fulcrum_session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const sessionId = parseCookie(request.headers.get("cookie") ?? "", cookieName);
  const user = await runtime.sessions.getAsync(sessionId);
  if (!user) return Response.json({authenticated: false, connected: false}, {status: 401});
  const guidedDemo = new URL(request.url).searchParams.get("guidedDemo") === "true" && Boolean(findDemoUser(user.id));
  if (guidedDemo) {
    const connection = getGuidedDemoConnection();
    return Response.json({authenticated: true, connected: Boolean(connection), mode: connection?.mode ?? "guided_demo_unconfigured", siteName: connection?.siteName, siteUrl: connection?.siteUrl});
  }
  const connection = await runtime.jiraConnections.getAsync(sessionId);
  return Response.json({authenticated: true, connected: Boolean(connection), mode: connection?.mode ?? "oauth", siteName: connection?.siteName, siteUrl: connection?.siteUrl});
}
