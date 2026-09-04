import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {buildAuthorizationUrl, jiraOAuthConfigured} from "../../../../src/integrations/jira-oauth.js";

const cookieName = "fulcrum_session";

export const dynamic = "force-dynamic";

export function GET(request) {
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  if (runtime.jiraConnections.get(user.id)) return Response.redirect(new URL("/sandbox?jira=connected", request.url));
  if (!jiraOAuthConfigured()) return Response.json({error: "jira_oauth_not_configured"}, {status: 503});
  const redirectUri = process.env.ATLASSIAN_REDIRECT_URI || `${new URL(request.url).origin}/api/jira/callback`;
  const state = runtime.jiraConnections.createState(user.id);
  return Response.redirect(buildAuthorizationUrl({clientId: process.env.ATLASSIAN_CLIENT_ID, redirectUri, state}));
}
