import test from "node:test";
import assert from "node:assert/strict";
import {buildAuthorizationUrl, getServiceAccountAccessToken, getServiceAccountConnection, JiraConnectionStore, jiraServiceAccountConfigured, USER_SCOPES} from "../src/integrations/jira-oauth.js";

test("Jira OAuth state is bound to the user and single-use", () => {
  const store = new JiraConnectionStore({now: () => 1000});
  const state = store.createState("analyst-7");
  assert.equal(store.consumeState(state, "analyst-7").userId, "analyst-7");
  assert.throws(() => store.consumeState(state, "analyst-7"), /invalid_oauth_state/);
});

test("Jira authorization URL requests sandbox consent", () => {
  const url = buildAuthorizationUrl({clientId: "client-1", redirectUri: "http://localhost:3000/api/jira/callback", state: "state-1"});
  assert.equal(url.origin, "https://auth.atlassian.com");
  assert.equal(url.searchParams.get("client_id"), "client-1");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.match(url.searchParams.get("scope"), /read:jira-work/);
  assert.match(url.searchParams.get("scope"), /offline_access/);
  assert.doesNotMatch(new URL(buildAuthorizationUrl({clientId: "client-1", redirectUri: "http://localhost:3000/api/jira/callback", state: "state-1", scope: USER_SCOPES})).searchParams.get("scope"), /offline_access/);
});

test("service-account configuration requires Jira target and client credentials", () => {
  assert.equal(jiraServiceAccountConfigured({ATLASSIAN_CLIENT_ID: "client", ATLASSIAN_CLIENT_SECRET: "secret", JIRA_CLOUD_ID: "cloud", JIRA_SITE_URL: "https://example.atlassian.net"}), true);
  assert.equal(jiraServiceAccountConfigured({ATLASSIAN_CLIENT_ID: "client", ATLASSIAN_CLIENT_SECRET: "secret"}), false);
});

test("service-account OAuth token uses client credentials and is cached", async () => {
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls += 1;
    assert.equal(url, "https://auth.atlassian.com/oauth/token");
    assert.equal(options.method, "POST");
    assert.match(options.body, /grant_type=client_credentials/);
    return new Response(JSON.stringify({access_token: "service-token", expires_in: 3600}), {status: 200});
  };
  const now = () => 1000;
  assert.equal(await getServiceAccountAccessToken({clientId: "client-cache", clientSecret: "secret", fetchImpl, now}), "service-token");
  assert.equal(await getServiceAccountAccessToken({clientId: "client-cache", clientSecret: "secret", fetchImpl, now}), "service-token");
  assert.equal(calls, 1);
});

test("service-account connection uses configured cloud and site", async () => {
  const connection = await getServiceAccountConnection({
    env: {ATLASSIAN_CLIENT_ID: "client-connection", ATLASSIAN_CLIENT_SECRET: "secret", JIRA_CLOUD_ID: "cloud-1", JIRA_SITE_URL: "https://geniushacks.atlassian.net"},
    fetchImpl: async () => new Response(JSON.stringify({access_token: "service-token", expires_in: 3600}), {status: 200}),
    now: () => 1000
  });
  assert.deepEqual(connection, {mode: "service_account", cloudId: "cloud-1", siteUrl: "https://geniushacks.atlassian.net", siteName: "geniushacks.atlassian.net", accessToken: "service-token"});
});
