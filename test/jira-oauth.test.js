import test from "node:test";
import assert from "node:assert/strict";
import {buildAuthorizationUrl, JiraConnectionStore} from "../src/integrations/jira-oauth.js";

test("Jira OAuth state is bound to the user and single-use", () => {
  const store = new JiraConnectionStore({now: () => 1000});
  const state = store.createState("analyst-7");
  assert.equal(store.consumeState(state, "analyst-7").userId, "analyst-7");
  assert.throws(() => store.consumeState(state, "analyst-7"), /invalid_oauth_state/);
});

test("Jira authorization URL requests read-only consent", () => {
  const url = buildAuthorizationUrl({clientId: "client-1", redirectUri: "http://localhost:3000/api/jira/callback", state: "state-1"});
  assert.equal(url.origin, "https://auth.atlassian.com");
  assert.equal(url.searchParams.get("client_id"), "client-1");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.match(url.searchParams.get("scope"), /read:jira-work/);
  assert.match(url.searchParams.get("scope"), /offline_access/);
});
