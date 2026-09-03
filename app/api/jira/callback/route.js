import {runtime} from "../../../../src/server/runtime.js";
import {parseCookie} from "../../../../src/auth/session.js";
import {exchangeCode, getAccessibleResources} from "../../../../src/integrations/jira-oauth.js";

const cookieName = "fulcrum_session";
const sandboxUrl = request => new URL("/sandbox", request.url);

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  const params = new URL(request.url).searchParams;
  const destination = sandboxUrl(request);
  if (!user) { destination.searchParams.set("jira", "authentication_required"); return Response.redirect(destination); }
  if (params.get("error")) { destination.searchParams.set("jira", "consent_denied"); return Response.redirect(destination); }
  try {
    const redirectUri = process.env.ATLASSIAN_REDIRECT_URI || `${new URL(request.url).origin}/api/jira/callback`;
    runtime.jiraConnections.consumeState(params.get("state"), user.id);
    const token = await exchangeCode({code: params.get("code"), clientId: process.env.ATLASSIAN_CLIENT_ID, clientSecret: process.env.ATLASSIAN_CLIENT_SECRET, redirectUri});
    const resources = await getAccessibleResources(token.access_token);
    const selected = resources.find(resource => !process.env.JIRA_CLOUD_ID || resource.id === process.env.JIRA_CLOUD_ID) ?? resources[0];
    if (!selected) throw new Error("jira_site_not_found");
    runtime.jiraConnections.set(user.id, {cloudId: selected.id, siteUrl: selected.url, siteName: selected.name, accessToken: token.access_token, refreshToken: token.refresh_token ?? null, expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000});
    runtime.audit.record({eventType: "JiraConnected", actorId: user.id, actorType: "DEMO_PERSONA", userRole: user.role, entityId: selected.id, metadata: {siteName: selected.name, scopes: "read:jira-work read:jira-user offline_access"}});
    destination.searchParams.set("jira", "connected");
  } catch (error) {
    runtime.audit.record({eventType: "JiraConnectionFailed", actorId: user.id, actorType: "DEMO_PERSONA", userRole: user.role, metadata: {reason: error.message}});
    destination.searchParams.set("jira", "connection_failed");
  }
  return Response.redirect(destination);
}
