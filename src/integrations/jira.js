const DEFAULT_FIELDS = ["summary", "status", "assignee", "updated", "duedate", "project", "issuetype"];

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
    assignee: fields.assignee?.displayName ?? null,
    dueDate: fields.duedate ?? null,
    projectKey,
    projectName: fields.project?.name ?? null,
    issueType: fields.issuetype?.name ?? null,
    updated: fields.updated ?? null,
    url: baseUrl && issue.key ? `${baseUrl.replace(/\/$/, "")}/browse/${issue.key}` : null,
    synthetic: false
  };
}

export async function fetchJiraWorkItems({projectKey, extraJql = "", cloudId = process.env.JIRA_CLOUD_ID, accessToken = process.env.JIRA_ACCESS_TOKEN, siteUrl = process.env.JIRA_SITE_URL, fetchImpl = fetch}) {
  const jql = buildJql(projectKey, extraJql);
  if (!cloudId || !accessToken) return {mode: "demo", jql, items: projectKey === "FCRM" ? demoWorkItems : []};

  const url = new URL(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/search/jql`);
  url.searchParams.set("jql", jql);
  url.searchParams.set("fields", DEFAULT_FIELDS.join(","));
  url.searchParams.set("maxResults", "50");
  const response = await fetchImpl(url, {headers: {accept: "application/json", authorization: `Bearer ${accessToken}`} });
  if (!response.ok) throw new Error(`jira_request_failed_${response.status}`);
  const payload = await response.json();
  return {mode: "live", jql, total: payload.total ?? payload.issues?.length ?? 0, items: (payload.issues ?? []).map(issue => normalizeIssue(issue, siteUrl))};
}
