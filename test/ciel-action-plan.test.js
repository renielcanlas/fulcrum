import assert from "node:assert/strict";
import test from "node:test";
import {fillActionResponse, parseCielActionPlan} from "../src/ai/ciel-action-plan.js";
import {normalizePreviousResponseId} from "../src/ai/provider.js";
import {looksLikeAssignmentRequest, refersToCurrentUser} from "../src/ai/ciel-intent.js";

test("Ciel action plans are normalized to a safe structured shape", () => {
  const plan = parseCielActionPlan(`\n\`\`\`json\n{"intent":"jira_assign","confidence":1.2,"issueKey":"fcrm-80","assigneePersona":"maya-chen","requiresConfirmation":true,"responsePlan":{"pending":"Assign {issueKey} to {assignee}?","success":"Assigned {issueKey} to {assignee}.","failure":"Could not assign {issueKey}: {reason}."}}\n\`\`\``);
  assert.equal(plan.intent, "jira_assign");
  assert.equal(plan.confidence, 1);
  assert.equal(plan.issueKey, "FCRM-80");
  assert.equal(plan.requiresConfirmation, true);
  assert.equal(fillActionResponse(plan.responsePlan.success, {issueKey: "FCRM-80", assignee: "Maya Chen"}), "Assigned FCRM-80 to Maya Chen.");
});

test("Ciel action plans reject non-object JSON", () => {
  assert.throws(() => parseCielActionPlan("[]"), /ciel_action_plan_invalid/);
});

test("empty or malformed response IDs are omitted before an Azure request", () => {
  assert.equal(normalizePreviousResponseId(""), undefined);
  assert.equal(normalizePreviousResponseId("   "), undefined);
  assert.equal(normalizePreviousResponseId("resp_abc-123_DEF"), "resp_abc-123_DEF");
  assert.equal(normalizePreviousResponseId("resp abc"), undefined);
});

test("assignment intent recognizes short confirmation context", () => {
  assert.equal(looksLikeAssignmentRequest("assign this to Marcus", (value) => /marcus/i.test(value)), true);
  assert.equal(looksLikeAssignmentRequest("yes assign", (value) => /marcus/i.test(value)), false);
  assert.equal(looksLikeAssignmentRequest("reassign the work item", () => false), true);
});

test("current-user references are explicit and narrow", () => {
  assert.equal(refersToCurrentUser("assign this to me"), true);
  assert.equal(refersToCurrentUser("assign this to myself"), true);
  assert.equal(refersToCurrentUser("assign this to Maya"), false);
});
