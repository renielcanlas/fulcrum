import test from "node:test";
import assert from "node:assert/strict";
import {buildJql, commentJiraWorkItem, createJiraWorkItem, deleteAllJiraWorkItems, fetchJiraWorkItems, getJiraProjectPermissions, getJiraWorkItem, normalizeIssue, transitionJiraWorkItem, updateJiraWorkItem} from "../src/integrations/jira.js";

test("Jira sandbox scopes searches to a valid project key", () => {
  assert.equal(buildJql("FCRM", "statusCategory != Done"), "project = FCRM AND (statusCategory != Done)");
  assert.throws(() => buildJql("fcrm"), /invalid_project_key/);
});

test("Jira sandbox returns no items without live credentials", async () => {
  const result = await fetchJiraWorkItems({projectKey: "FCRM", cloudId: "", accessToken: ""});
  assert.equal(result.mode, "not_connected");
  assert.deepEqual(result.items, []);
});

test("Jira project permission check requests the sandbox capabilities", async () => {
  let requestUrl;
  const permissions = await getJiraProjectPermissions({projectKey: "FCRM", cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async (url) => {
    requestUrl = url.toString();
    return new Response(JSON.stringify({permissions: {BROWSE_PROJECTS: {havePermission: true}, CREATE_ISSUES: {havePermission: false}}}), {status: 200});
  }});
  assert.equal(permissions.CREATE_ISSUES.havePermission, false);
  assert.match(requestUrl, /projectKey=FCRM/);
  assert.match(requestUrl, /CREATE_ISSUES/);
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
    key: "ABC-7", id: "10001", summary: "Review controls", status: "indeterminate", statusName: "In Progress", assignee: "A. Reviewer", dueDate: "2026-09-10", projectKey: "ABC", projectName: "Alpha", issueType: "Task", updated: "2026-09-03T10:00:00.000Z", url: "https://example.atlassian.net/browse/ABC-7", synthetic: false
  });
});

test("Jira localizes known workflow labels to stable English display names", () => {
  const item = normalizeIssue({key: "FCRM-8", fields: {summary: "Decision item", status: {name: "决策"}, issuetype: {name: "任务"}}});
  assert.equal(item.statusName, "Decision");
  assert.equal(item.issueType, "Task");
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

test("Ciel can retrieve a linked Jira story with service-account auth", async () => {
  let request;
  const item = await getJiraWorkItem({issueKey: "FCRM-80", cloudId: "cloud-1", accessToken: "token-1", siteUrl: "https://example.atlassian.net", fetchImpl: async (url, options) => {
    request = {url: url.toString(), options};
    return new Response(JSON.stringify({id: "80", key: "FCRM-80", fields: {summary: "Story", description: {type: "doc", content: [{type: "paragraph", content: [{type: "text", text: "Details"}]}]}, status: {name: "Intake"}, labels: ["synthetic"], project: {key: "FCRM"}, issuetype: {name: "Task"}}}), {status: 200});
  }});
  assert.equal(item.description, "Details");
  assert.equal(item.statusName, "Intake");
  assert.equal(item.url, "https://example.atlassian.net/browse/FCRM-80");
  assert.equal(request.options.headers.authorization, "Bearer token-1");
  assert.match(request.url, /FCRM-80\?fields=/);
});

test("Jira sandbox creates a basic Task with bearer auth", async () => {
  let requestOptions;
  const created = await createJiraWorkItem({projectKey: "ABC", summary: "Review payment controls", description: "Assess launch readiness.", cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async (url, options) => {
    requestOptions = {url, options};
    return new Response(JSON.stringify({id: "2", key: "ABC-2"}), {status: 201});
  }});
  assert.deepEqual(created, {id: "2", key: "ABC-2", self: undefined});
  assert.equal(requestOptions.options.method, "POST");
  assert.equal(requestOptions.options.headers.authorization, "Bearer token-1");
  assert.match(requestOptions.options.body, /Review payment controls/);
});

test("cleanup deletes only issues returned by the FCRM project search", async () => {
  const requests = [];
  const result = await deleteAllJiraWorkItems({cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async (url, options = {}) => {
    requests.push({url: url.toString(), options});
    if (options.method === "DELETE") return new Response(null, {status: 204});
    return new Response(JSON.stringify({issues: [{key: "FCRM-1"}, {key: "FCRM-2"}]}), {status: 200});
  }});
  assert.deepEqual(result, {deleted: 2, matched: 2});
  assert.match(requests[0].url, /project\+%3D\+FCRM/);
  assert.deepEqual(requests.slice(1).map((request) => request.url.split("/").pop()), ["FCRM-1", "FCRM-2"]);
  assert.equal(requests[1].options.method, "DELETE");
});

test("Jira sandbox adds a comment to an issue", async () => {
  let request;
  const result = await commentJiraWorkItem({issueKey: "FCRM-9", body: "Synthetic analyst note.", cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async (url, options) => {
    request = {url: url.toString(), options};
    return new Response(JSON.stringify({id: "comment-1"}), {status: 201});
  }});
  assert.deepEqual(result, {issueKey: "FCRM-9", commentId: "comment-1", commented: true});
  assert.equal(request.options.method, "POST");
  assert.match(request.url, /FCRM-9\/comment$/);
  assert.match(request.options.body, /Synthetic analyst note/);
});

test("Jira sandbox matches localized workflow status aliases", async () => {
  const requests = [];
  const result = await transitionJiraWorkItem({issueKey: "FCRM-9", status: "Review", cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async (url, options = {}) => {
    requests.push({url: url.toString(), options});
    if (options.method === "POST") return new Response(null, {status: 204});
    return new Response(JSON.stringify({transitions: [{id: "31", to: {name: "审查"}}]}), {status: 200});
  }});
  assert.equal(result.status, "审查");
  assert.equal(requests[1].options.method, "POST");
  assert.match(requests[1].options.body, /31/);
});

test("Jira sandbox preserves update validation details", async () => {
  await assert.rejects(() => updateJiraWorkItem({issueKey: "FCRM-9", fields: {priority: {name: "Invalid"}}, cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async () => new Response(JSON.stringify({errors: {priority: "Priority is not available"}}), {status: 400})}), /jira_update_failed_400: priority: Priority is not available/);
});

test("Jira sandbox converts plain descriptions to Atlassian Document Format", async () => {
  let body;
  await updateJiraWorkItem({issueKey: "FCRM-9", fields: {description: "Acceptance criteria"}, cloudId: "cloud-1", accessToken: "token-1", fetchImpl: async (url, options) => {
    body = JSON.parse(options.body);
    return new Response(null, {status: 204});
  }});
  assert.deepEqual(body.fields.description, {type: "doc", version: 1, content: [{type: "paragraph", content: [{type: "text", text: "Acceptance criteria"}]}]});
});
