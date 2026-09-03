import test from "node:test";
import assert from "node:assert/strict";
import {buildJql, fetchJiraWorkItems, normalizeIssue} from "../src/integrations/jira.js";

test("Jira sandbox scopes searches to a valid project key", () => {
  assert.equal(buildJql("FCRM", "statusCategory != Done"), "project = FCRM AND (statusCategory != Done)");
  assert.throws(() => buildJql("fcrm"), /invalid_project_key/);
});

test("Jira sandbox returns synthetic work items without live credentials", async () => {
  const result = await fetchJiraWorkItems({projectKey: "FCRM", cloudId: "", accessToken: ""});
  assert.equal(result.mode, "demo");
  assert.equal(result.items[0].key, "FCRM-101");
  assert.equal(result.items[0].synthetic, true);
});

test("Jira responses are normalized to the sandbox contract", () => {
  const item = normalizeIssue({
    id: "10001",
    key: "ABC-7",
    fields: {
      summary: "Review controls",
      status: {name: "In Progress", statusCategory: {key: "indeterminate"}},
      assignee: {displayName: "A. Reviewer"},
      duedate: "2026-09-10",
      project: {key: "ABC", name: "Alpha"},
      issuetype: {name: "Task"},
      updated: "2026-09-03T10:00:00.000Z"
    }
  }, "https://example.atlassian.net");
  assert.deepEqual(item, {
    key: "ABC-7", id: "10001", summary: "Review controls", status: "indeterminate", assignee: "A. Reviewer", dueDate: "2026-09-10", projectKey: "ABC", projectName: "Alpha", issueType: "Task", updated: "2026-09-03T10:00:00.000Z", url: "https://example.atlassian.net/browse/ABC-7", synthetic: false
  });
});

test("live Jira search sends bearer auth and requested fields", async () => {
  let requestedUrl;
  let requestedOptions;
  const result = await fetchJiraWorkItems({
    projectKey: "ABC",
    cloudId: "cloud-1",
    accessToken: "token-1",
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestedOptions = options;
      return new Response(JSON.stringify({total: 1, issues: [{id: "1", key: "ABC-1", fields: {summary: "One"}}]}), {status: 200});
    }
  });
  assert.equal(result.mode, "live");
  assert.match(requestedUrl.toString(), /project\+%3D\+ABC/);
  assert.equal(requestedOptions.headers.authorization, "Bearer token-1");
  assert.equal(result.items[0].key, "ABC-1");
});
