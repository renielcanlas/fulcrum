import {JIRA_PROJECT_KEY} from "./jira-config.js";
const DEFAULT_FIELDS = ["summary", "status", "assignee", "updated", "duedate", "project", "issuetype"];
const STATUS_ALIASES = {
  review: ["审查"],
  decision: ["决策"]
};
const DISPLAY_STATUS_NAMES = new Map([
  ["审查", "Review"], ["决策", "Decision"],
  ["上下文和研究", "Context and Research"], ["背景和研究", "Context and Research"],
  ["风险评估", "Risk Assessment"], ["接收", "Intake"], ["受理", "Intake"]
]);
const DISPLAY_ISSUE_TYPES = new Map([["任务", "Task"]]);
const JIRA_LANGUAGE_HEADERS = {"accept-language": "en-US", "x-force-accept-language": "true"};

function displayStatusName(status, category) {
  const name = status?.trim();
  if (!name) return "Unknown";
  if (DISPLAY_STATUS_NAMES.has(name)) return DISPLAY_STATUS_NAMES.get(name);
  if (/^[\u3400-\u9fff\u3040-\u30ff]+$/.test(name)) {
    return {new: "Intake", indeterminate: "In Progress", done: "Done"}[category] ?? "Unknown";
  }
  return name;
}

export const demoWorkItems = [
  {key: "FCRM-101", id: "jira-101", summary: "Implement enhanced remittance monitoring rules", status: "IN_PROGRESS", assignee: "Daniel Reyes", dueDate: "2026-09-05", projectKey: "FCRM", projectName: "Fulcrum", issueType: "Task", updated: null, url: null, synthetic: true},
  {key: "FCRM-102", id: "jira-102", summary: "Complete HarborBridge partner due diligence", status: "OPEN", assignee: "Maya Chen", dueDate: "2026-09-04", projectKey: "FCRM", projectName: "Fulcrum", issueType: "Task", updated: null, url: null, synthetic: true}
];

export function buildJql(projectKey, extraJql = "") {
  if (!/^[A-Z][A-Z0-9_]{1,9}$/.test(projectKey)) throw new Error("invalid_project_key");
  const suffix = extraJql.trim();
  return `project = ${projectKey}${suffix ? ` AND (${suffix})` : ""}`;
}

export function normalizeIssue(issue, baseUrl = "") {
  const fields = issue.fields ?? {};
  const projectKey = fields.project?.key ?? issue.key?.split("-")[0] ?? null;
  return {
    key: issue.key,
    id: issue.id,
    summary: fields.summary ?? "Untitled issue",
    status: fields.status?.statusCategory?.key ?? fields.status?.name ?? "UNKNOWN",
    statusName: displayStatusName(fields.status?.name, fields.status?.statusCategory?.key),
    assignee: fields.assignee?.displayName ?? null,
    dueDate: fields.duedate ?? null,
    projectKey,
    projectName: fields.project?.name ?? null,
    issueType: DISPLAY_ISSUE_TYPES.get(fields.issuetype?.name) ?? fields.issuetype?.name ?? null,
    updated: fields.updated ?? null,
    url: baseUrl && issue.key ? `${baseUrl.replace(/\/$/, "")}/browse/${issue.key}` : null,
    synthetic: false
  };
}

export function validateCreateInput({projectKey, summary, description = "", issueType = "Task", labels = []}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}$/.test(projectKey)) throw new Error("invalid_project_key");
  if (!summary?.trim() || summary.trim().length > 255) throw new Error("invalid_summary");
  if (description.length > 10000) throw new Error("invalid_description");
  if (!/^[A-Za-z][A-Za-z0-9 _-]{0,49}$/.test(issueType)) throw new Error("invalid_issue_type");
  if (!Array.isArray(labels) || labels.some(label => !/^[A-Za-z0-9_-]{1,50}$/.test(label))) throw new Error("invalid_labels");
}

export async function createJiraWorkItem({projectKey, summary, description = "", issueType = "Task", labels = [], cloudId, accessToken, fetchImpl = fetch}) {
  validateCreateInput({projectKey, summary, description, issueType, labels});
  if (!cloudId || !accessToken) throw new Error("jira_connection_required");
  const url = `https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, "content-type": "application/json", authorization: `Bearer ${accessToken}`},
    body: JSON.stringify({fields: {project: {key: projectKey}, summary: summary.trim(), description: {type: "doc", version: 1, content: [{type: "paragraph", content: [{type: "text", text: description}]}]}, issuetype: {name: issueType}, labels}})
  });
  if (!response.ok) throw new Error(`jira_create_failed_${response.status}`);
  const created = await response.json();
  return {id: created.id, key: created.key, self: created.self};
}

export async function updateJiraWorkItem({issueKey, fields, cloudId, accessToken, fetchImpl = fetch}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issueKey) || !fields || typeof fields !== "object") throw new Error("invalid_update");
  const normalizedFields = {...fields};
  if (typeof normalizedFields.description === "string") normalizedFields.description = {type: "doc", version: 1, content: [{type: "paragraph", content: [{type: "text", text: normalizedFields.description}]}]};
  const response = await fetchImpl(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {method: "PUT", headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, "content-type": "application/json", authorization: `Bearer ${accessToken}`}, body: JSON.stringify({fields: normalizedFields})});
  if (!response.ok) {
    const detail = await jiraResponseDetail(response);
    throw new Error(`jira_update_failed_${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return {issueKey, updated: true};
}

export async function assignJiraWorkItem({issueKey, accountId, cloudId, accessToken, fetchImpl = fetch}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issueKey) || !accountId || accountId.startsWith("jira-")) throw new Error("invalid_assignee");
  const response = await fetchImpl(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue/${encodeURIComponent(issueKey)}/assignee`, {method: "PUT", headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, "content-type": "application/json", authorization: `Bearer ${accessToken}`}, body: JSON.stringify({accountId})});
  if (!response.ok) { const detail = await jiraResponseDetail(response); throw new Error(`jira_assign_failed_${response.status}${detail ? `: ${detail}` : ""}`); }
  return {issueKey, accountId, assigned: true};
}

function jiraDocumentText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value.content ?? []).flatMap((item) => item.text ?? jiraDocumentText(item)).filter(Boolean).join(" ").trim();
}

export async function getJiraWorkItem({issueKey, cloudId, accessToken, siteUrl = process.env.JIRA_SITE_URL, fetchImpl = fetch}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issueKey) || !cloudId || !accessToken) throw new Error("invalid_jira_issue_lookup");
  const fields = ["summary", "description", "status", "assignee", "priority", "labels", "project", "issuetype", "updated", "comment"].join(",");
  const response = await fetchImpl(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(fields)}`, {headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
  if (!response.ok) throw new Error(`jira_issue_lookup_failed_${response.status}`);
  const issue = await response.json();
  const source = issue.fields ?? {};
  return {key: issue.key, id: issue.id, summary: source.summary ?? "", description: jiraDocumentText(source.description), status: source.status?.name ?? "", statusName: displayStatusName(source.status?.name, source.status?.category?.key ?? source.status?.statusCategory?.key), assignee: source.assignee?.displayName ?? null, assigneeAccountId: source.assignee?.accountId ?? null, priority: source.priority?.name ?? null, labels: Array.isArray(source.labels) ? source.labels : [], projectKey: source.project?.key ?? null, issueType: source.issuetype?.name ?? null, updated: source.updated ?? null, comments: (source.comment?.comments ?? []).map((comment) => ({id: comment.id, author: comment.author?.displayName ?? "Unknown", body: jiraDocumentText(comment.body), created: comment.created ?? null, updated: comment.updated ?? null})), url: siteUrl && issue.key ? `${siteUrl.replace(/\/$/, "")}/browse/${issue.key}` : null};
}

export async function transitionJiraWorkItem({issueKey, status, cloudId, accessToken, fetchImpl = fetch}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issueKey) || !status?.trim()) throw new Error("invalid_transition");
  const base = `https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue/${encodeURIComponent(issueKey)}`;
  const transitionsResponse = await fetchImpl(`${base}/transitions`, {headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
  if (!transitionsResponse.ok) throw new Error(`jira_transitions_failed_${transitionsResponse.status}`);
  const availableTransitions = (await transitionsResponse.json()).transitions ?? [];
  const requestedStatus = status.trim();
  const candidates = [requestedStatus, ...(STATUS_ALIASES[requestedStatus.toLowerCase()] ?? [])].map(value => value.toLowerCase());
  const transition = availableTransitions.find(item => candidates.includes(item.to?.name?.trim().toLowerCase()));
  if (!transition) throw new Error(`jira_transition_unavailable: ${availableTransitions.map(item => item.to?.name).filter(Boolean).join(", ") || "no available transitions"}`);
  const response = await fetchImpl(`${base}/transitions`, {method: "POST", headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, "content-type": "application/json", authorization: `Bearer ${accessToken}`}, body: JSON.stringify({transition: {id: transition.id}})});
  if (!response.ok) throw new Error(`jira_transition_failed_${response.status}`);
  return {issueKey, status: transition.to.name, transitioned: true};
}

export function jiraErrorStatus(error) {
  const match = error.message?.match(/jira_[a-z_]+_(\d{3})(?:$|:)/);
  return match ? Number(match[1]) : null;
}

async function jiraResponseDetail(response) {
  const body = await response.text();
  try {
    const payload = JSON.parse(body);
    const errors = Object.entries(payload.errors ?? {}).map(([field, message]) => `${field}: ${message}`);
    return [...(payload.errorMessages ?? []), ...errors, payload.message].filter(Boolean).join("; ").slice(0, 1000);
  } catch {
    return body.trim().slice(0, 1000);
  }
}

export async function getJiraProjectPermissions({projectKey = JIRA_PROJECT_KEY, cloudId, accessToken, fetchImpl = fetch}) {
  if (!cloudId || !accessToken) throw new Error("jira_connection_required");
  const url = new URL(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/mypermissions`);
  url.searchParams.set("projectKey", projectKey);
  url.searchParams.set("permissions", "BROWSE_PROJECTS,CREATE_ISSUES,EDIT_ISSUES,ADD_COMMENTS,ASSIGN_ISSUES,DELETE_ISSUES,TRANSITION_ISSUES");
  const response = await fetchImpl(url, {headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
  if (!response.ok) throw new Error(`jira_permissions_failed_${response.status}`);
  return (await response.json()).permissions ?? {};
}

export async function commentJiraWorkItem({issueKey, body, cloudId, accessToken, fetchImpl = fetch}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issueKey) || !body?.trim()) throw new Error("invalid_comment");
  const response = await fetchImpl(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {method: "POST", headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, "content-type": "application/json", authorization: `Bearer ${accessToken}`}, body: JSON.stringify({body: {type: "doc", version: 1, content: [{type: "paragraph", content: [{type: "text", text: body.trim()}]}]}})});
  if (!response.ok) throw new Error(`jira_comment_failed_${response.status}`);
  const comment = await response.json();
  return {issueKey, commentId: comment.id, commented: true};
}

export async function deleteAllJiraWorkItems({projectKey = JIRA_PROJECT_KEY, cloudId, accessToken, fetchImpl = fetch}) {
  if (projectKey !== JIRA_PROJECT_KEY) throw new Error("invalid_cleanup_project");
  if (!cloudId || !accessToken) throw new Error("jira_connection_required");
  const base = `https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}`;
  const issues = [];
  let nextPageToken;
  do {
    const searchUrl = new URL(`${base}/rest/api/3/search/jql`);
    searchUrl.searchParams.set("jql", `project = ${JIRA_PROJECT_KEY}`);
    searchUrl.searchParams.set("fields", "key");
    searchUrl.searchParams.set("maxResults", "100");
    if (nextPageToken) searchUrl.searchParams.set("nextPageToken", nextPageToken);
    const searchResponse = await fetchImpl(searchUrl, {headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
    if (!searchResponse.ok) throw new Error(`jira_cleanup_search_failed_${searchResponse.status}`);
    const page = await searchResponse.json();
    issues.push(...(page.issues ?? []));
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);
  let deleted = 0;
  for (const issue of issues) {
    if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issue.key) || !issue.key.startsWith(`${JIRA_PROJECT_KEY}-`)) throw new Error("invalid_cleanup_issue");
    const deleteResponse = await fetchImpl(`${base}/rest/api/3/issue/${encodeURIComponent(issue.key)}`, {method: "DELETE", headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
    if (!deleteResponse.ok) throw new Error(`jira_delete_failed_${deleteResponse.status}`);
    deleted += 1;
  }
  return {deleted, matched: issues.length};
}

export async function deleteJiraWorkItem({issueKey, cloudId, accessToken, fetchImpl = fetch}) {
  if (!/^[A-Z][A-Z0-9_]{1,9}-[1-9][0-9]*$/.test(issueKey) || !issueKey.startsWith(`${JIRA_PROJECT_KEY}-`)) throw new Error("invalid_rollback_issue");
  const response = await fetchImpl(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {method: "DELETE", headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
  if (!response.ok) throw new Error(`jira_rollback_delete_failed_${response.status}`);
  return {issueKey, rolledBack: true};
}

export async function fetchJiraWorkItems({projectKey, extraJql = "", cloudId = process.env.JIRA_CLOUD_ID, accessToken = process.env.JIRA_ACCESS_TOKEN, siteUrl = process.env.JIRA_SITE_URL, fetchImpl = fetch}) {
  const jql = buildJql(projectKey, extraJql);
  if (!cloudId || !accessToken) return {mode: "not_connected", jql, total: 0, items: []};

  const url = new URL(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/search/jql`);
  url.searchParams.set("jql", jql);
  url.searchParams.set("fields", DEFAULT_FIELDS.join(","));
  url.searchParams.set("maxResults", "50");
  const response = await fetchImpl(url, {headers: {accept: "application/json", ...JIRA_LANGUAGE_HEADERS, authorization: `Bearer ${accessToken}`} });
  if (!response.ok) throw new Error(`jira_request_failed_${response.status}`);
  const payload = await response.json();
  return {mode: "live", jql, total: payload.total ?? payload.issues?.length ?? 0, items: (payload.issues ?? []).map(issue => normalizeIssue(issue, siteUrl))};
}
