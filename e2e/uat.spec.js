import {expect, test} from "@playwright/test";

const users = [
  {id: "po-1", displayName: "Maya Chen", email: "maya.chen@fulcrum.demo", role: "PRODUCT_OWNER", jiraIdentity: {jiraAccountId: "acct-po"}},
  {id: "analyst-7", displayName: "Daniel Reyes", email: "daniel.reyes@fulcrum.demo", role: "FCRM_ANALYST", jiraIdentity: {jiraAccountId: "acct-analyst"}},
  {id: "committee-1", displayName: "Helen Morgan", email: "helen.morgan@fulcrum.demo", role: "RISK_COMMITTEE", jiraIdentity: {jiraAccountId: "acct-committee"}},
];

const workItem = {
  key: "FCRM-101",
  summary: "Synthetic remittance review",
  description: "Synthetic business context for UAT.",
  statusName: "Intake",
  assignee: "Maya Chen",
  assigneeAccountId: "acct-po",
  projectKey: "FCRM",
  issueType: "Task",
  priority: "High",
  labels: ["synthetic"],
  comments: [],
  attachments: [],
};

const publishedAssessment = {
  version: "intake-v1",
  stage: "Intake",
  assessedAt: "2026-09-16T00:00:00.000Z",
  publishedAt: "2026-09-16T00:00:00.000Z",
  score: 80,
  maxScore: 100,
  recommendation: "Proceed",
  decisionWeighting: {automaticPercent: 25, aiPercent: 75},
  weightedDecision: {score: 80, maxScore: 100, recommendation: "Proceed", automaticPercent: 25, aiPercent: 75},
  checks: [{id: "summary", label: "Clear summary", weight: 100, state: "pass", points: 80, failure: null}],
  source: {issueKey: "FCRM-101", updated: "2026-09-16T00:00:00.000Z"},
};

async function mockSessionAndCommonApis(page, user) {
  await page.route("**/api/session**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({json: {ok: true, user}});
    } else {
      await route.fulfill({json: {user}});
    }
  });
  await page.route("**/api/demo-users**", (route) => route.fulfill({json: users}));
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has("issue")) {
      await route.fulfill({json: {item: workItem}});
    } else {
      await route.fulfill({json: {items: []}});
    }
  });
}

test("UAT: demo user can sign in through the normal login flow", async ({page}) => {
  await page.route("**/api/demo-users**", (route) => route.fulfill({json: users}));
  await page.route("**/api/session**", async (route) => {
    if (route.request().method() === "POST") await route.fulfill({json: {ok: true, user: users[0]}});
    else await route.fulfill({json: {user: users[0]}});
  });
  await page.goto("/login");
  await page.getByLabel("Select a demo user").selectOption("po-1");
  await expect(page.locator("#username")).toHaveValue(users[0].email);
  await expect(page.locator("#password")).toHaveValue("genius123!");
  await page.getByRole("button", {name: "Sign in"}).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText("FCRM workbench")).toBeVisible();
});

test("UAT: non-Product Owner cannot access Initiatives", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  await page.goto("/demo?view=initiatives");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("button", {name: "Initiatives", exact: true})).toHaveCount(0);
});

test("UAT: Help Center explains Jira personas and validation", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=help-center");
  await page.getByRole("button", {name: /Jira integration.*Read guide/i}).click();
  const jiraGuide = page.locator("#help-jira-integration");
  await expect(jiraGuide.getByRole("heading", {name: "Jira integration"})).toBeVisible();
  await expect(jiraGuide.getByText("Maya Chen", {exact: true})).toBeVisible();
  await expect(jiraGuide.getByText("Daniel Reyes", {exact: true})).toBeVisible();
  await expect(jiraGuide.getByText("Helen Morgan", {exact: true})).toBeVisible();
  await expect(jiraGuide.getByText(/How to validate Jira integration/)).toBeVisible();
});

test("UAT: reevaluation replaces old metrics with a loading state", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Intake", published: publishedAssessment, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  await page.route("**/api/jira/assessment/ai", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({json: {ok: true, assessment: publishedAssessment, attachmentEvidence: []}});
  });
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByRole("button", {name: "Re-evaluate Intake"})).toBeVisible();
  await page.getByRole("button", {name: "Re-evaluate Intake"}).click();
  await expect(page.getByRole("status", {name: "Re-evaluating Intake"})).toBeVisible();
  await expect(page.getByText("80/100")).toHaveCount(0);
});

test("UAT: stage movement opens reassignment modal before transition", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Intake", published: publishedAssessment, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByRole("button", {name: "Move to Context and Research"}).click();
  await expect(page.getByRole("heading", {name: /Reassign before moving to Context and Research/})).toBeVisible();
  await expect(page.getByLabel("Next-stage assignee")).toBeVisible();
  await expect(page.getByRole("button", {name: "Confirm assignment and move"})).toBeDisabled();
});
