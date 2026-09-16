import test from "node:test";
import assert from "node:assert/strict";
import {POST} from "../app/api/session/route.js";
import {runtime} from "../src/server/runtime.js";

test("password login refreshes the session and revokes stale Jira connections", async () => {
  runtime.jiraConnections.set("demo:analyst-7", {accessToken:"old-session-token"});
  runtime.jiraConnections.set("analyst-7", {accessToken:"legacy-old-token"});
  runtime.jiraConnections.set("demo:po-1", {accessToken:"selected-persona-token"});
  runtime.jiraConnections.set("po-1", {accessToken:"legacy-selected-token"});

  const response = await POST(new Request("http://localhost/api/session", {
    method: "POST",
    headers: {cookie: "fulcrum_session=demo:analyst-7", "content-type": "application/json"},
    body: JSON.stringify({username: "maya.chen@fulcrum.demo", password: "genius123!"}),
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.user.id, "po-1");
  assert.equal(body.sessionRefreshed, false);
  assert.equal(runtime.jiraConnections.get("demo:analyst-7"), null);
  assert.equal(runtime.jiraConnections.get("analyst-7"), null);
  assert.equal(runtime.jiraConnections.get("demo:po-1"), null);
  assert.equal(runtime.jiraConnections.get("po-1"), null);
  assert.match(response.headers.get("set-cookie"), /fulcrum_session=[A-Za-z0-9_-]{30,}/);
});
