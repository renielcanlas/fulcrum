import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {buildAuthorizationUrl, USER_SCOPES} from "../../../../src/integrations/jira-oauth.js";

const cookieName = "fulcrum_session";

export const dynamic = "force-dynamic";

export function GET(request) {
  const sessionId = parseCookie(request.headers.get("cookie") ?? "", cookieName);
  const user = runtime.sessions.get(sessionId);
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  if (!process.env.ATLASSIAN_USER_CLIENT_ID || !process.env.ATLASSIAN_USER_CLIENT_SECRET) return Response.json({error: "jira_user_oauth_3lo_credentials_missing"}, {status: 503});
  const params = new URL(request.url).searchParams;
  const returnTo = params.get("returnTo") || "/demo";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo.slice(0, 500) : "/demo";
  const redirectUri = process.env.ATLASSIAN_REDIRECT_URI || `${new URL(request.url).origin}/api/jira/callback`;
  const state = runtime.jiraConnections.createState(user.id, {returnTo: safeReturnTo, purpose: "user_comment", sessionId});
  return Response.redirect(buildAuthorizationUrl({clientId: process.env.ATLASSIAN_USER_CLIENT_ID, redirectUri, state, scope: USER_SCOPES}));
}
