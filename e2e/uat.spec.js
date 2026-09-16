import {expect, test} from "@playwright/test";

test.afterEach(async ({page}, testInfo) => {
  const screenshot = await page.screenshot({fullPage: true});
  await testInfo.attach("uat-screenshot", {body: screenshot, contentType: "image/png"});
  await testInfo.attach("uat-metadata", {
    body: JSON.stringify({
      title: testInfo.title,
      status: testInfo.status,
      expectedStatus: testInfo.expectedStatus,
      durationMs: testInfo.duration,
      url: page.url(),
    }, null, 2),
    contentType: "application/json",
  });
});

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

test("UAT: Help Center keeps topics focused and supports returning to the topic list", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=help-center");
  const topics = ["Evidence & lineage", "Human decisions", "Jira integration", "Ciel and AI", "Risk & controls", "Sandbox usage", "Guided demos"];
  for (const topic of topics) {
    await page.getByRole("button", {name: new RegExp(`${topic}.*Read guide`, "i")}).click();
    await expect(page.getByRole("button", {name: "← All help topics"})).toBeVisible();
    await page.getByRole("button", {name: "← All help topics"}).click();
    await expect(page.getByRole("button", {name: new RegExp(`${topic}.*Read guide`, "i")})).toBeVisible();
  }
});

test("UAT: Product Owner can load the Golden Initiative and review the creation confirmation", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.route("**/api/jira/create**", (route) => route.fulfill({status: 201, json: {key: "FCRM-202", accountableOwner: "Maya Chen", accountableOwnerVerified: true}}));
  await page.goto("/demo?view=initiatives");
  await page.getByRole("button", {name: "Load Golden Initiative"}).click();
  await expect(page.locator('[data-tour="initiative-summary"] input')).toHaveValue("Launch U.S.–Philippines Instant Remittance");
  await page.getByRole("button", {name: "Create initiative"}).click();
  await expect(page.getByRole("heading", {name: "Create this Jira initiative?"})).toBeVisible();
  await expect(page.getByText("FCRM · Task · High")).toBeVisible();
  await page.getByRole("button", {name: "Confirm and create"}).click();
  await expect(page.getByText(/Created FCRM-202 in Jira/)).toBeVisible();
});

test("UAT: Analyst can edit configuration and only sees Save after a change", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {id: "demo", mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", async (route) => {
    if (route.request().method() === "PUT") await route.fulfill({json: {ok: true, section: "assessments", config: {...configuration.assessments, proceedThreshold: 70}}});
    else await route.fulfill({json: {configuration}});
  });
  await page.goto("/demo?view=configuration");
  await expect(page.locator("h1").filter({hasText: "Configuration"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Save configuration"})).toHaveCount(0);
  await page.getByLabel("Proceed to next step threshold").fill("70");
  await expect(page.getByRole("button", {name: "Save configuration"})).toBeVisible();
  await page.getByRole("button", {name: "Save configuration"}).click();
  await expect(page.getByText("assessments configuration saved.", {exact: false})).toBeVisible();
});

test("UAT: confirmed stage handoff assigns the next owner before transitioning", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Intake", published: publishedAssessment, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  let assignmentBody;
  let transitionBody;
  await page.route("**/api/jira/assign**", async (route) => { assignmentBody = route.request().postDataJSON(); await route.fulfill({json: {ok: true, verified: true}}); });
  await page.route("**/api/jira/assessment", async (route) => { if (route.request().method() === "POST") { transitionBody = route.request().postDataJSON(); await route.fulfill({json: {ok: true}}); } else await route.fulfill({json: {stage: "Intake", published: publishedAssessment, history: [publishedAssessment], allHistory: [publishedAssessment]}}); });
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByRole("button", {name: "Move to Context and Research"}).click();
  await page.getByLabel("Next-stage assignee").selectOption("analyst-7");
  await page.getByRole("button", {name: "Confirm assignment and move"}).click();
  await expect.poll(() => assignmentBody?.personaId).toBe("analyst-7");
  await expect.poll(() => transitionBody?.action).toBe("transition");
});

test("UAT: landing page exposes the entry journey and sandbox flag", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.goto("/");
  await expect(page.getByRole("heading", {name: /Make every initiative decision-ready/})).toBeVisible();
  await expect(page.getByRole("button", {name: "Login", exact: true})).toBeVisible();
  await expect(page.getByRole("link", {name: /Explore the sandbox/})).toBeVisible();
  await expect(page.getByRole("heading", {name: /A complete decision journey/})).toBeVisible();
  await page.getByRole("button", {name: "Login", exact: true}).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("UAT: landing Start demo begins the guided login journey", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  const marcus = {id: "po-2", displayName: "Marcus Thompson", email: "marcus.thompson@fulcrum.demo", role: "PRODUCT_OWNER", jiraIdentity: {jiraAccountId: "acct-marcus"}};
  await page.route("**/api/demo-users**", (route) => route.fulfill({json: [...users, marcus]}));
  const guidedWorkItem = {
    key: "FCRM-300",
    summary: "Launch U.S.–Philippines Instant Remittance",
    description: "Accountable owner\nMaya Chen\n\nProblem / opportunity\nCustomers need a faster, lower-friction way to send money from the United States to recipients in the Philippines.\n\nIntended outcome\nLaunch a bounded digital remittance service with traceable FCRM controls.",
    statusName: "Intake",
    assignee: "Maya Chen",
    assigneeAccountId: "acct-po",
    projectKey: "FCRM",
    issueType: "Task",
    priority: "High",
    labels: ["payments", "remittance", "golden-demo"],
    comments: [],
    attachments: [],
    url: "https://example.atlassian.net/browse/FCRM-300",
  };
  const guidedAssessment = {
    version: "intake-v1",
    stage: "Intake",
    assessedAt: "2026-09-16T00:00:00.000Z",
    score: 88,
    maxScore: 100,
    recommendation: "Proceed",
    decisionWeighting: {automaticPercent: 25, aiPercent: 75},
    weightedDecision: {score: 84, maxScore: 100, recommendation: "Proceed", automaticPercent: 25, aiPercent: 75},
    configurationSnapshot: {assessment: {proceedThreshold: 70}},
    scoring: {partialCreditFactor: 0.5},
    checks: [{id: "summary", label: "Clear summary", weight: 100, state: "pass", points: 88, failure: null}],
    aiDecisionSupport: {
      score: 82,
      maxScore: 100,
      recommendation: "Proceed",
      reviewedCheckCount: 1,
      summary: "The bounded remittance context is sufficiently clear for the next review step, subject to partner diligence and monitoring ownership.",
      challenge: "Confirm the local partner evidence before launch.",
      pros: ["Clear corridor and scope"],
      cons: ["Partner diligence remains open"],
      rationale: ["The context identifies the product, markets, and key controls."],
      proposedComment: "Review partner diligence and monitoring ownership before launch.",
      checkReviews: [{checkId: "summary", points: 82, weight: 100, observation: "Summary and ownership are clear."}],
    },
    aiContext: {commentCount: 0, attachmentCount: 0, extractedAttachmentCount: 0},
  };
  const history = [];
  let createBody;
  let commentBody;
  let assignedPersona;
  let assessmentCalls = 0;
  await page.route("**/api/jira/create**", async (route) => {
    createBody = route.request().postDataJSON();
    await route.fulfill({status: 201, json: {key: guidedWorkItem.key, url: guidedWorkItem.url, accountableOwner: "Maya Chen", accountableOwnerVerified: true}});
  });
  await page.route(/\/api\/jira\/assessment\/ai(?:\?.*)?$/, async (route) => {
    assessmentCalls += 1;
    await route.fulfill({json: {ok: true, assessment: {...guidedAssessment, assessedAt: new Date().toISOString()}, attachmentEvidence: []}});
  });
  await page.route(/\/api\/jira\/assessment(?:\?.*)?$/, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({json: {stage: guidedWorkItem.statusName, published: history[0] ?? null, history, allHistory: history}});
      return;
    }
    const body = route.request().postDataJSON();
    if (body.action === "publish") {
      const version = {...body.assessment, publishedAt: new Date().toISOString(), revision: history.length + 1, commentId: `guided-${history.length + 1}`};
      history.unshift(version);
    }
    if (body.action === "transition") guidedWorkItem.statusName = "Context and Research";
    await route.fulfill({json: {ok: true}});
  });
  await page.route("**/api/jira/user-status**", (route) => route.fulfill({json: {connected: true}}));
  await page.route("**/api/jira/comment**", async (route) => {
    commentBody = route.request().postDataJSON();
    guidedWorkItem.comments.push({id: "guided-comment", author: "fulcrum-bot", body: commentBody.body, created: new Date().toISOString()});
    await route.fulfill({json: {ok: true, commentId: "guided-comment"}});
  });
  await page.route("**/api/jira/attachment/upload**", async (route) => {
    guidedWorkItem.attachments.push({id: "guided-pdf", filename: "Golden Initiative - FULCRUM.pdf", mimeType: "application/pdf", size: 420, author: "Maya Chen"});
    await route.fulfill({json: {ok: true, attachmentId: "guided-pdf"}});
  });
  await page.route("**/api/jira/assign**", async (route) => {
    assignedPersona = route.request().postDataJSON().personaId;
    guidedWorkItem.assignee = "Marcus Thompson";
    guidedWorkItem.assigneeAccountId = "acct-marcus";
    await route.fulfill({json: {ok: true, verified: true}});
  });
  await page.route("**/api/jira?issue=FCRM-300", (route) => route.fulfill({json: {item: guidedWorkItem}}));
  await page.route("**/api/session**", async (route) => {
    if (route.request().method() === "POST") await route.fulfill({json: {ok: true, user: users[0]}});
    else await route.fulfill({json: {user: users[0]}});
  });
  await page.goto("/");
  await page.getByRole("button", {name: "Start the demo", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Start with Login"})).toBeVisible();
  await page.getByRole("button", {name: "Open Login"}).click();
  await expect(page).toHaveURL(/\/login\?guided=1$/);
  await expect(page.getByRole("heading", {name: "Choose a synthetic demo user"})).toBeVisible();
  await expect(page.getByText(/Maya Chen is the Product Owner/)).toBeVisible();
  await expect(page.getByLabel("Select a demo user")).toHaveValue("po-1");
  await expect(page.locator("#username")).toHaveValue(users[0].email);
  await expect(page.locator("#password")).toHaveValue("genius123!");
  await page.getByRole("button", {name: "Continue to login"}).click();
  await expect(page).toHaveURL(/\/demo$/);
  const next = () => page.getByRole("button", {name: "Next", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Understand the board at a glance"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Explore the initiative board"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Ask Ciel for explanations"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "What Initiatives is for"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Find other guided demos"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Experiment safely in Sandbox"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Find useful platform information"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Begin the prepared Golden Initiative flow"})).toBeVisible();
  await page.getByRole("button", {name: "Load Golden Initiative"}).click(); await next();
  await expect(page.getByRole("heading", {name: "Create it under Maya Chen"})).toBeVisible();
  await page.getByRole("button", {name: "Create initiative"}).click(); await next();
  await expect(page.getByRole("heading", {name: "Confirm and create the Jira initiative"})).toBeVisible();
  await page.getByRole("button", {name: "Confirm and create"}).click();
  await expect.poll(() => createBody?.owner).toBe("Maya Chen"); await next();
  await expect(page.getByRole("heading", {name: "Confirm the Jira creation"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Continue in FULCRUM"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Review the initiative context"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "FULCRUM evaluation"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Start the evaluation"})).toBeVisible();
  await page.getByRole("button", {name: "Evaluate Intake"}).click({force: true}); await expect.poll(() => assessmentCalls).toBe(1); await expect(page.getByText("AI response", {exact: true})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Read the summary scores"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Scoring configuration"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Understand the AI response"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Review the evaluation metrics"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Know when FULCRUM suggests the next step"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Publish the evaluation to Jira"})).toBeVisible();
  await page.getByRole("button", {name: "Publish evaluation to Jira"}).click(); await next();
  await expect(page.getByRole("heading", {name: "Re-evaluate when the result needs another look"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Comments stay connected to Jira"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Add a contextual comment"})).toBeVisible();
  await expect(page.getByPlaceholder("Write a comment to add to Jira…")).toHaveValue(/FULCRUM review:/);
  await next(); await expect.poll(() => commentBody?.body).toMatch(/FULCRUM review:/);
  await expect(page.getByRole("heading", {name: "Attachments provide supporting context"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Add the sample PDF"})).toBeVisible();
  await next(); await expect.poll(() => guidedWorkItem.attachments.length).toBe(1);
  await expect(page.getByRole("heading", {name: "Re-evaluate after adding context"})).toBeVisible();
  await page.getByRole("button", {name: "Re-evaluate Intake"}).click(); await expect(page.getByText("AI response", {exact: true})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Publish the reevaluation"})).toBeVisible();
  await page.getByRole("button", {name: "Publish evaluation to Jira"}).click(); await next();
  await expect(page.getByRole("heading", {name: "Compare assessment versions"})).toBeVisible(); await next();
  await expect(page.getByRole("heading", {name: "Move to the next stage when ready"})).toBeVisible();
  await page.getByRole("button", {name: "Move to Context and Research"}).click();
  await expect(page.getByRole("heading", {name: "Reassign the next stage"})).toBeVisible();
  await page.getByLabel("Next-stage assignee").selectOption("po-2");
  await page.getByRole("button", {name: "Confirm assignment and move"}).click();
  await expect.poll(() => assignedPersona).toBe("po-2");
});

test("UAT: invalid credentials remain on login and show an actionable error", async ({page}) => {
  await page.route("**/api/demo-users**", (route) => route.fulfill({json: users}));
  await page.route("**/api/session**", async (route) => {
    if (route.request().method() === "POST") await route.fulfill({status: 401, json: {error: "invalid_credentials"}});
    else await route.fulfill({json: {user: null}});
  });
  await page.goto("/login");
  await page.locator("#username").fill("unknown@fulcrum.demo");
  await page.locator("#password").fill("wrong-password");
  await page.getByRole("button", {name: "Sign in"}).click();
  await expect(page.locator("p[role=alert]")).toHaveText("The username or password is not correct.");
  await expect(page).toHaveURL(/\/login$/);
});

test("UAT: Product Owner sees the full guided-demo entry points", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo");
  await expect(page.locator("aside nav button").filter({hasText: "Initiatives"})).toBeVisible();
  await expect(page.locator("aside nav button").filter({hasText: "Guided demos"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Welcome tour"})).toBeVisible();
  await page.getByRole("button", {name: "Welcome tour"}).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", {name: "Start with the dashboard"})).toBeVisible();
  await page.getByRole("button", {name: "Next", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Live Jira board"})).toBeVisible();
});

test("UAT: guided demos expose both welcome and golden-initiative tours", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=guided-demos");
  await expect(page.getByRole("heading", {name: "Explore the FULCRUM workbench"})).toBeVisible();
  const cards = page.locator("article");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("Welcome Tour");
  await expect(cards.nth(1)).toContainText("Create the Golden Initiative");
  await cards.nth(1).getByRole("button", {name: "Start tour"}).click();
  await expect(page.getByRole("heading", {name: "Create a decision-ready initiative"})).toBeVisible();
});

test("UAT: every workspace information section renders its intended heading", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  const sections = [
    ["evidence", "Evidence & lineage"],
    ["controls", "Risk & controls"],
    ["decisions", "Decisions"],
    ["jira", "Jira integration"],
    ["help-center", "Help center"],
  ];
  for (const [view, heading] of sections) {
    await page.goto(`/demo?view=${view}`);
    await expect(page.getByRole("heading", {name: heading, exact: true})).toBeVisible();
  }
});

test("UAT: evidence and decision sections open their provenance view", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  const trace = {
    committee: {finalDecision: {outcome: "ACCEPTED"}},
    lifecycle: {assessment: "Published assessment"},
    traceability: [{observationId: "risk-1"}],
    scoreCalculation: {residualRating: "Medium", residualScore: 42},
    humanDispositions: [{observationId: "risk-1", action: "ACCEPT"}],
    sourceDocuments: [], facts: [],
  };
  await page.route("**/api/initiatives/INIT-2026-0007/trace", (route) => route.fulfill({json: trace}));
  await page.goto("/demo?view=evidence");
  await page.getByRole("button", {name: /Inspect detailed provenance/}).click();
  await expect(page.getByRole("heading", {name: "Decision trace"})).toBeVisible();
  await expect(page.getByText("System calculation: ", {exact: false})).toBeVisible();
});

test("UAT: configuration controls preserve independent risk sliders and expose explanations", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", async (route) => {
    if (route.request().method() === "PUT") await route.fulfill({json: {ok: true, section: "risk", config: configuration.risk}});
    else await route.fulfill({json: {configuration}});
  });
  await page.goto("/demo?view=configuration");
  const s1 = page.getByRole("slider", {name: "S1 low-risk ceiling"});
  const s2 = page.getByRole("slider", {name: "S2 high-risk floor"});
  await expect(s1).toHaveAttribute("aria-valuenow", "49");
  await expect(s2).toHaveAttribute("aria-valuenow", "70");
  await s1.press("ArrowRight");
  await expect(s1).toHaveAttribute("aria-valuenow", "50");
  await expect(s2).toHaveAttribute("aria-valuenow", "70");
  await expect(page.getByText("0–50", {exact: true})).toBeVisible();
  await expect(page.getByText(/Control mitigation strength/)).toBeVisible();
});

test("UAT: disabled Sandbox is hidden from navigation and direct access redirects", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.unroute("**/api/features**");
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: false}}));
  await page.goto("/demo");
  await expect(page.getByRole("button", {name: "Sandbox", exact: true})).toHaveCount(0);
  await page.goto("/sandbox");
  await expect(page).toHaveURL(/\/$/);
});

test("UAT: enabled Sandbox loads connection, scenarios, and AI status", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira/status", (route) => route.fulfill({json: {connected: true, projectKey: "FCRM"}}));
  await page.route("**/api/sandbox/scenarios", (route) => route.fulfill({json: {scenarios: [{id: "scenario-1", name: "Synthetic scenario", description: "Safe test"}]}}));
  await page.route("**/api/ai/status", (route) => route.fulfill({json: {available: true}}));
  await page.goto("/sandbox");
  await expect(page.getByRole("button", {name: "Jira search", exact: true}).first()).toBeVisible();
  await page.getByRole("button", {name: "Scenario automator", exact: true}).first().click();
  await expect(page.getByRole("button", {name: "Scenario automator", exact: true}).first()).toBeVisible();
  await expect(page.getByText("Synthetic scenario", {exact: true})).toBeVisible();
});

test("UAT: committee member can record a human decision only after rationale", async ({page}) => {
  const reviewItem = {...workItem, statusName: "Review"};
  await mockSessionAndCommonApis(page, users[2]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has("issue")) await route.fulfill({json: {item: reviewItem}});
    else await route.fulfill({json: {items: []}});
  });
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Review", published: {...publishedAssessment, stage: "Review"}, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  await page.route("**/api/jira/decision?issue=FCRM-101", async (route) => {
    if (route.request().method() === "POST") await route.fulfill({json: {ok: true}});
    else await route.fulfill({json: {decisions: []}});
  });
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByRole("region", {name: "Human decision panel"})).toBeVisible();
  const submit = page.getByRole("button", {name: "Record human decision"});
  await expect(submit).toBeDisabled();
  await page.getByPlaceholder("Explain the human decision and material considerations.").fill("Committee accepts the bounded launch subject to documented monitoring conditions.");
  await expect(submit).toBeEnabled();
});

test("UAT: connected Jira user can add a comment from a work item", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  await page.route("**/api/jira/user-status", (route) => route.fulfill({json: {connected: true}}));
  let commentBody;
  await page.route("**/api/jira/comment", async (route) => {
    commentBody = route.request().postDataJSON();
    await route.fulfill({json: {ok: true, commentId: "comment-uat-1"}});
  });
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  const comment = page.getByPlaceholder("Write a comment to add to Jira…");
  await expect(comment).toBeVisible();
  await comment.fill("Synthetic UAT comment for the governed work item.");
  await page.getByRole("button", {name: "Post comment"}).click();
  await expect.poll(() => commentBody?.body).toBe("Synthetic UAT comment for the governed work item.");
  await expect(page.getByText("Synthetic UAT comment for the governed work item.", {exact: true})).toBeVisible();
});

test("UAT: Golden Initiative keeps Maya Chen as the accountable owner", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  let createBody;
  await page.route("**/api/jira/create**", async (route) => {
    createBody = route.request().postDataJSON();
    await route.fulfill({status: 201, json: {key: "FCRM-203", accountableOwner: "Maya Chen", accountableOwnerVerified: true}});
  });
  await page.goto("/demo?view=initiatives");
  await page.getByRole("button", {name: "Load Golden Initiative"}).click();
  await expect(page.locator('[data-tour="initiative-owner"] select')).toHaveValue("Maya Chen");
  await page.getByRole("button", {name: "Create initiative"}).click();
  await page.getByRole("button", {name: "Confirm and create"}).click();
  await expect.poll(() => createBody?.owner).toBe("Maya Chen");
});

test("UAT: risk scoring explanation is collapsed until requested", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", (route) => route.fulfill({json: {configuration}}));
  await page.goto("/demo?view=configuration");
  const learn = page.getByText("Learn more about risk scoring", {exact: true});
  const details = learn.locator("..");
  await expect(details).not.toHaveAttribute("open", "");
  await learn.click();
  await expect(page.getByText(/If the starting score is 78/)).toBeVisible();
});

test("UAT: decision-support controls update independently and expose their guidance", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", (route) => route.fulfill({json: {configuration}}));
  await page.goto("/demo?view=configuration");
  const ai = page.getByLabel("AI score weighting percentage");
  const proceed = page.getByLabel("Proceed to next step threshold");
  await ai.fill("80");
  await expect(ai).toHaveValue("80");
  await expect(proceed).toHaveValue("80");
  await page.getByText("Learn more about decision support", {exact: true}).click();
  await expect(page.getByText(/AI score contributes/)).toBeVisible();
});

test("UAT: application configuration can disable Sandbox at runtime", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", async (route) => {
    if (route.request().method() === "PUT") await route.fulfill({json: {ok: true, section: "application", config: {...configuration.application, allowSyntheticSandbox: false}}});
    else await route.fulfill({json: {configuration}});
  });
  await page.goto("/demo?view=configuration");
  await page.getByRole("checkbox", {name: "Allow synthetic Sandbox"}).uncheck();
  await page.getByRole("button", {name: "Save configuration"}).click();
  await expect(page.getByRole("button", {name: "Sandbox", exact: true})).toHaveCount(0);
});

test("UAT: Jira integration page presents the synthetic persona roster", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=jira");
  await expect(page.getByRole("heading", {name: "Demo persona access"})).toBeVisible();
  for (const persona of ["Maya Chen", "Marcus Thompson", "Daniel Reyes", "Priya Shah", "Helen Morgan", "Robert Kim"]) {
    await expect(page.getByRole("cell", {name: persona, exact: true})).toBeVisible();
  }
  await expect(page.getByText("genius123!", {exact: true}).first()).toBeVisible();
});

test("UAT: work item can be assigned directly through the verified assignment dialog", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  let assignment;
  await page.route("**/api/jira/assign**", async (route) => { assignment = route.request().postDataJSON(); await route.fulfill({json: {ok: true, verified: true}}); });
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByRole("button", {name: "Assign", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Assign FCRM-101"})).toBeVisible();
  await page.getByLabel("New assignee").selectOption("committee-1");
  await page.getByRole("button", {name: "Confirm assignment"}).click();
  await expect.poll(() => assignment?.personaId).toBe("committee-1");
});

test("UAT: work item navigation returns to the board", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByText("FCRM-101", {exact: true}).first()).toBeVisible();
  await page.getByRole("button", {name: "← Back to board"}).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", {name: "Initiative board"})).toBeVisible();
});

test("UAT: Ciel chat opens, shows context, and clears its conversation", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByRole("button", {name: "Open AI chat"}).click();
  await expect(page.getByRole("heading", {name: "Initiative-aware chat"})).toBeVisible();
  await expect(page.getByText(/Jira FCRM-101/)).toBeVisible();
  await page.getByRole("button", {name: "Clear Ciel chat"}).click();
  await expect(page.getByText("Hi, I’m Ciel. I can help you understand this initiative and its decision trail.", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Close Ciel chat"}).click();
  await expect(page.getByRole("heading", {name: "Initiative-aware chat"})).toHaveCount(0);
});

test("UAT: board card links open the selected Jira work item", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({json: url.searchParams.has("issue") ? {item: workItem} : {items: [workItem]}});
  });
  await page.goto("/demo");
  await expect(page.getByText("FCRM-101", {exact: true})).toBeVisible();
  await page.getByText("FCRM-101", {exact: true}).click();
  await expect(page).toHaveURL(/view=work-item&issue=FCRM-101/);
  await expect(page.getByText("Synthetic remittance review", {exact: true})).toBeVisible();
});

test("UAT: Sandbox search sends the JQL filter and renders results", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira/status", (route) => route.fulfill({json: {connected: false}}));
  await page.route("**/api/sandbox/scenarios", (route) => route.fulfill({json: {scenarios: []}}));
  await page.route("**/api/ai/status", (route) => route.fulfill({json: {connected: false}}));
  let query;
  await page.route("**/api/jira?**", async (route) => { query = new URL(route.request().url()).searchParams.get("jql"); await route.fulfill({json: {items: [{key: "FCRM-555", summary: "Synthetic search result", status: "Intake", assignee: "Maya Chen"}]}}); });
  await page.goto("/sandbox");
  await page.getByLabel("Optional JQL filter").fill("statusCategory != Done");
  await page.getByRole("button", {name: "Search Jira"}).click();
  await expect.poll(() => query).toBe("statusCategory != Done");
  await expect(page.getByText("Synthetic search result", {exact: true})).toBeVisible();
});

test("UAT: Sandbox automator exposes details and JSON tabs", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira/status", (route) => route.fulfill({json: {connected: true}}));
  await page.route("**/api/sandbox/scenarios", (route) => route.fulfill({json: {scenarios: [{id: "scenario-1", fileName: "safe.json", name: "Safe scenario", steps: []}]}}));
  await page.route("**/api/ai/status", (route) => route.fulfill({json: {connected: true}}));
  await page.goto("/sandbox");
  await page.getByRole("button", {name: "Scenario automator", exact: true}).first().click();
  await expect(page.getByRole("button", {name: "Details", exact: true})).toBeVisible();
  await page.getByRole("button", {name: "JSON", exact: true}).click();
  await expect(page.locator("pre")).toContainText('"steps"');
  await page.getByRole("button", {name: "Details", exact: true}).click();
  await expect(page.getByText("Safe scenario", {exact: true})).toBeVisible();
});

test("UAT: missing session returns the visitor to the landing page", async ({page}) => {
  await page.route("**/api/session**", (route) => route.fulfill({json: {user: null}}));
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", {name: /Make every initiative decision-ready/})).toBeVisible();
});

test("UAT: session API failures show the recovery screen", async ({page}) => {
  await page.route("**/api/session**", (route) => route.fulfill({status: 503, json: {error: "session_service_unavailable"}}));
  await page.goto("/demo");
  await expect(page.getByText("Demo session could not load", {exact: true})).toBeVisible();
  await expect(page.getByText("session_service_unavailable", {exact: true})).toBeVisible();
});

test("UAT: login can preserve the Sandbox destination", async ({page}) => {
  await page.route("**/api/demo-users**", (route) => route.fulfill({json: users}));
  await page.route("**/api/session**", async (route) => {
    if (route.request().method() === "POST") await route.fulfill({json: {ok: true, user: users[0]}});
    else await route.fulfill({json: {user: null}});
  });
  await page.goto("/login?next=/sandbox");
  await page.getByLabel("Select a demo user").selectOption("po-1");
  await page.getByRole("button", {name: "Sign in"}).click();
  await expect(page).toHaveURL(/\/sandbox$/);
});

test("UAT: landing page hides Sandbox when the feature flag is disabled", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: false}}));
  await page.goto("/");
  await expect(page.getByRole("link", {name: /Explore the sandbox/})).toHaveCount(0);
});

test("UAT: Help Center hides topic cards while a topic is selected", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=help-center");
  await page.getByRole("button", {name: /Evidence & lineage.*Read guide/i}).click();
  await expect(page.getByRole("button", {name: /Evidence & lineage.*Read guide/i})).toHaveCount(0);
  await expect(page.getByRole("button", {name: "← All help topics"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Evidence & lineage"})).toBeVisible();
});

test("UAT: configuration save appears only for the changed section", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", (route) => route.fulfill({json: {configuration}}));
  await page.goto("/demo?view=configuration");
  await expect(page.getByRole("button", {name: "Save configuration"})).toHaveCount(0);
  await page.getByLabel("Jira project key").fill("FCRM2");
  await expect(page.getByRole("button", {name: "Save configuration"})).toHaveCount(1);
});

test("UAT: risk boundary keyboard controls preserve independent handles and spacing", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", (route) => route.fulfill({json: {configuration}}));
  await page.goto("/demo?view=configuration");
  const s1 = page.getByRole("slider", {name: "S1 low-risk ceiling"});
  const s2 = page.getByRole("slider", {name: "S2 high-risk floor"});
  await s1.press("End");
  await expect(s1).toHaveAttribute("aria-valuenow", "65");
  await expect(s2).toHaveAttribute("aria-valuenow", "70");
  await s2.press("End");
  await expect(s2).toHaveAttribute("aria-valuenow", "95");
  await expect(s1).toHaveAttribute("aria-valuenow", "65");
  await s1.press("Home");
  await expect(s1).toHaveAttribute("aria-valuenow", "5");
  await expect(s2).toHaveAttribute("aria-valuenow", "95");
});

test("UAT: disconnected Jira user is prompted before adding a comment or attachment", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.route("**/api/jira/user-status", (route) => route.fulfill({json: {connected: false}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByRole("link", {name: "Add comment", exact: true})).toBeVisible();
  await expect(page.getByRole("link", {name: "Connect Jira to attach", exact: true})).toBeVisible();
});

test("UAT: first-time work item assessment offers Evaluate Intake", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Intake", published: null, assessment: null, history: [], allHistory: []}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByRole("button", {name: "Evaluate Intake"})).toBeVisible();
});

test("UAT: transition reassignment dialog can be cancelled safely", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Intake", published: publishedAssessment, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByRole("button", {name: "Move to Context and Research"}).click();
  await expect(page.getByRole("heading", {name: /Reassign before moving/})).toBeVisible();
  await page.getByRole("button", {name: "Cancel", exact: true}).click();
  await expect(page.getByRole("heading", {name: /Reassign before moving/})).toHaveCount(0);
  await expect(page.getByRole("button", {name: "Move to Context and Research"})).toBeVisible();
});

test("UAT: non-committee users see the human-decision governance boundary", async ({page}) => {
  const reviewItem = {...workItem, statusName: "Review"};
  await mockSessionAndCommonApis(page, users[1]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({json: url.searchParams.has("issue") ? {item: reviewItem} : {items: []}}); });
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Review", published: {...publishedAssessment, stage: "Review"}, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  await page.route("**/api/jira/decision?issue=FCRM-101", (route) => route.fulfill({json: {decisions: []}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByText("Only a Risk Committee member can record the final decision.", {exact: true})).toBeVisible();
  await expect(page.getByRole("button", {name: "Record human decision"})).toHaveCount(0);
});

test("UAT: non-Product Owners cannot reach Initiatives through direct URLs or the Welcome Tour", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  await page.goto("/demo?view=initiatives");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", {name: "Initiatives", exact: true})).toHaveCount(0);
  await page.getByRole("button", {name: "Welcome tour"}).click();
  await expect(page.getByRole("heading", {name: "Start with the dashboard"})).toBeVisible();
  for (let step = 0; step < 12; step += 1) {
    const initiativeStep = page.getByRole("heading", {name: "Formulate an initiative"});
    await expect(initiativeStep).toHaveCount(0);
    const next = page.getByRole("button", {name: "Next", exact: true});
    if (await next.count() === 0) break;
    await next.click();
  }
  await expect(page.getByRole("heading", {name: "Formulate an initiative"})).toHaveCount(0);
});

test("UAT: shared workspace information is linked through Help center for every non-Product Owner", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  await page.goto("/demo");
  const navigation = page.getByRole("navigation", {name: "Demo navigation"});
  await expect(navigation.locator("button").filter({hasText: "Evidence & lineage"})).toHaveCount(0);
  await expect(navigation.locator("button").filter({hasText: "Risk & controls"})).toHaveCount(0);
  await expect(navigation.locator("button").filter({hasText: "Decisions"})).toHaveCount(0);
  await expect(navigation.locator("button").filter({hasText: "Jira integration"})).toHaveCount(0);
  await navigation.locator("button").filter({hasText: "Help center"}).click();
  await expect(page.getByRole("heading", {name: "Help center", exact: true})).toBeVisible();
  for (const topic of ["Evidence & lineage", "Risk & controls", "Human decisions", "Jira integration"]) {
    await expect(page.getByRole("button", {name: new RegExp(`${topic}.*Read guide`, "i")})).toBeVisible();
  }
  await expect(navigation.getByRole("button", {name: "Initiatives", exact: true})).toHaveCount(0);
});

test("UAT: Sandbox custom scenario rejects malformed JSON visibly", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira/status", (route) => route.fulfill({json: {connected: true}}));
  await page.route("**/api/sandbox/scenarios", (route) => route.fulfill({json: {scenarios: []}}));
  await page.route("**/api/ai/status", (route) => route.fulfill({json: {connected: false}}));
  await page.goto("/sandbox");
  await page.getByRole("button", {name: "Scenario automator", exact: true}).first().click();
  await page.getByLabel("Scenario source").selectOption("custom");
  await page.getByLabel("Scenario JSON").fill("{not valid json");
  await expect(page.locator("p[role=alert]")).toContainText("Invalid JSON");
  await expect(page.getByRole("button", {name: "Execute scenario"})).toBeDisabled();
});

test("UAT: mobile users receive the compact demo navigation", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/demo");
  await expect(page.getByRole("navigation", {name: "Mobile demo navigation"})).toBeVisible();
  await expect(page.getByRole("navigation", {name: "Mobile demo navigation"}).getByRole("button", {name: "Help center"})).toBeVisible();
  await expect(page.locator("aside")).toBeHidden();
});

test("UAT: every demo persona can populate the login form", async ({page}) => {
  await page.route("**/api/demo-users**", (route) => route.fulfill({json: users}));
  await page.goto("/login");
  for (const user of users) {
    await page.getByLabel("Select a demo user").selectOption(user.id);
    await expect(page.locator("#username")).toHaveValue(user.email);
    await expect(page.locator("#password")).toHaveValue("genius123!");
  }
});

test("UAT: empty initiative form requires context before creation", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=initiatives");
  const create = page.getByRole("button", {name: "Create initiative"});
  await expect(create).toBeEnabled();
  await expect(page.locator('[data-tour="initiative-summary"] input')).toHaveAttribute("required", "");
});

test("UAT: initiative owner selector contains the governed demo personas", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.goto("/demo?view=initiatives");
  await page.getByRole("button", {name: "Load Golden Initiative"}).click();
  const owner = page.locator('[data-tour="initiative-owner"] select');
  await expect(owner.locator("option")).toHaveCount(4);
  await expect(owner.locator("option").allTextContents()).resolves.toEqual(["Select an owner", "Maya Chen · PRODUCT_OWNER", "Daniel Reyes · FCRM_ANALYST", "Helen Morgan · RISK_COMMITTEE"]);
});

test("UAT: configuration writes the changed integration section only", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  let saveBody;
  await page.route("**/api/configuration**", async (route) => {
    if (route.request().method() === "PUT") { saveBody = route.request().postDataJSON(); await route.fulfill({json: {ok: true, section: "integrations", config: {...configuration.integrations, jiraProjectKey: "FCRM2"}}}); }
    else await route.fulfill({json: {configuration}});
  });
  await page.goto("/demo?view=configuration");
  await page.getByLabel("Jira project key").fill("FCRM2");
  await page.getByRole("button", {name: "Save configuration"}).click();
  await expect.poll(() => saveBody?.section).toBe("integrations");
  await expect.poll(() => saveBody?.values?.jiraProjectKey).toBe("FCRM2");
});

test("UAT: session lifetime is editable as a runtime application setting", async ({page}) => {
  await mockSessionAndCommonApis(page, users[1]);
  const configuration = {risk: {mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}}, assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75}, application: {demoSessionMinutes: 15, allowSyntheticSandbox: true}, integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://example.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true}};
  await page.route("**/api/configuration**", (route) => route.fulfill({json: {configuration}}));
  await page.goto("/demo?view=configuration");
  const lifetime = page.getByLabel(/Session lifetime \(minutes\)/);
  await expect(lifetime).toHaveValue("15");
  await lifetime.fill("30");
  await expect(page.getByRole("button", {name: "Save configuration"})).toHaveCount(1);
});

test("UAT: Jira board errors are rendered as a recoverable board state", async ({page}) => {
  await mockSessionAndCommonApis(page, users[0]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", (route) => route.fulfill({status: 502, json: {error: "jira_board_load_failed"}}));
  await page.goto("/demo");
  await expect(page.getByText(/Unable to load Jira board/)).toBeVisible();
});

test("UAT: PDF attachment opens in the evidence preview dialog", async ({page}) => {
  const itemWithPdf = {...workItem, attachments: [{id: "pdf-1", filename: "synthetic-evidence.pdf", mimeType: "application/pdf", size: 1024, author: "Maya Chen"}]};
  await mockSessionAndCommonApis(page, users[0]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({json: url.searchParams.has("issue") ? {item: itemWithPdf} : {items: []}}); });
  await page.route("**/api/jira/user-status", (route) => route.fulfill({json: {connected: true}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByRole("button", {name: "synthetic-evidence.pdf", exact: true}).click();
  await expect(page.getByRole("heading", {name: "synthetic-evidence.pdf"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Close", exact: true})).toBeVisible();
});

test("UAT: Fulcrum comments remain collapsed until expanded", async ({page}) => {
  const commentedItem = {...workItem, comments: [{id: "fulcrum-1", author: "FULCRUM", body: "FULCRUM_EVALUATION_JSON:\n{\"score\":80}", created: "2026-09-16T00:00:00.000Z"}]};
  await mockSessionAndCommonApis(page, users[0]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({json: url.searchParams.has("issue") ? {item: commentedItem} : {items: []}}); });
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByText("FULCRUM automated comment · click to expand", {exact: true})).toBeVisible();
  await expect(page.getByText("Machine-readable evaluation data is hidden from this comment view.", {exact: true})).not.toBeVisible();
  await page.getByText("FULCRUM automated comment · click to expand", {exact: true}).click();
  await expect(page.getByText("Machine-readable evaluation data is hidden from this comment view.", {exact: true})).toBeVisible();
});

test("UAT: assessment history allows selecting an older published version", async ({page}) => {
  const older = {...publishedAssessment, stage: "Context and Research", version: "intake-v0", score: 60, publishedAt: "2026-09-15T00:00:00.000Z", revision: 1};
  const contextItem = {...workItem, statusName: "Context and Research"};
  await mockSessionAndCommonApis(page, users[0]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({json: url.searchParams.has("issue") ? {item: contextItem} : {items: []}}); });
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Context and Research", published: publishedAssessment, history: [publishedAssessment, older], allHistory: [publishedAssessment, older]}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await expect(page.getByRole("button", {name: "v1", exact: true})).toBeVisible();
  await expect(page.getByRole("button", {name: "v2", exact: true})).toBeVisible();
  await page.getByRole("button", {name: "v1", exact: true}).click();
  await expect(page.getByText("60/100", {exact: true})).toBeVisible();
});

test("UAT: rejected human outcome remains available with rationale", async ({page}) => {
  const reviewItem = {...workItem, statusName: "Review"};
  await mockSessionAndCommonApis(page, users[2]);
  await page.unroute("**/api/jira**");
  await page.route("**/api/jira**", async (route) => { const url = new URL(route.request().url()); await route.fulfill({json: url.searchParams.has("issue") ? {item: reviewItem} : {items: []}}); });
  await page.route("**/api/jira/assessment?issue=FCRM-101", (route) => route.fulfill({json: {stage: "Review", published: {...publishedAssessment, stage: "Review"}, history: [publishedAssessment], allHistory: [publishedAssessment]}}));
  await page.route("**/api/jira/decision?issue=FCRM-101", (route) => route.fulfill({json: {decisions: []}}));
  await page.goto("/demo?view=work-item&issue=FCRM-101");
  await page.getByLabel("Outcome").selectOption("REJECTED");
  await expect(page.getByLabel("Outcome")).toHaveValue("REJECTED");
  await page.getByPlaceholder("Explain the human decision and material considerations.").fill("Reject pending additional evidence and remediation of the identified control gaps.");
  await expect(page.getByRole("button", {name: "Record human decision"})).toBeEnabled();
});

test("UAT: Sandbox search errors are shown without breaking the page", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira/status", (route) => route.fulfill({json: {connected: false}}));
  await page.route("**/api/sandbox/scenarios", (route) => route.fulfill({json: {scenarios: []}}));
  await page.route("**/api/ai/status", (route) => route.fulfill({json: {connected: false}}));
  await page.route("**/api/jira", (route) => route.fulfill({status: 502, json: {error: "jira_request_failed"}}));
  await page.goto("/sandbox");
  await page.getByRole("button", {name: "Search Jira"}).click();
  await expect(page.getByText("jira_request_failed", {exact: true})).toBeVisible();
});

test("UAT: Sandbox connection status is displayed when Jira is ready", async ({page}) => {
  await page.route("**/api/features**", (route) => route.fulfill({json: {allowSyntheticSandbox: true}}));
  await page.route("**/api/jira/status", (route) => route.fulfill({json: {connected: true, authenticated: true, ready: true}}));
  await page.route("**/api/sandbox/scenarios", (route) => route.fulfill({json: {scenarios: []}}));
  await page.route("**/api/ai/status", (route) => route.fulfill({json: {connected: true}}));
  await page.goto("/sandbox");
  await expect(page.getByText("✓ Jira connected", {exact: true})).toBeVisible();
  await expect(page.getByText("✓ Azure AI connected", {exact: true})).toBeVisible();
});
