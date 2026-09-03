import test from "node:test";
import assert from "node:assert/strict";
import {FakeProvider} from "../src/ai/provider.js";
import {CopilotOrchestrator} from "../src/ai/orchestrator.js";
import {AuditLog} from "../src/audit/audit.js";
import {createDemoRepository, createToolRegistry} from "../src/tools/assessment-tools.js";

const user = {id:"analyst-7", role:"FCRM_ANALYST"};
test("copilot executes typed tools and audits the interaction", async () => {
  const provider = new FakeProvider([{output:[{type:"function_call", name:"getRiskScores", call_id:"c1", arguments:JSON.stringify({assessmentId:"FA-2026-00124"})}]},{output_text:"The configured engine reports HIGH at score 78; threshold is 70."}]);
  const audit = new AuditLog();
  const result = await new CopilotOrchestrator({provider, tools:createToolRegistry(createDemoRepository()), audit}).respond({interactionId:"i1", conversationId:"c1", user, assessmentId:"FA-2026-00124", message:"Why is this high?"});
  assert.match(result.output_text, /HIGH/);
  assert.equal(provider.calls.length, 2);
  assert.deepEqual(audit.all()[0].toolsInvoked, ["getRiskScores"]);
});

test("product owners cannot read analyst-only risk data or another owner's assessment", () => {
  const tools = createToolRegistry(createDemoRepository());
  const owner = {id:"po-1", role:"PRODUCT_OWNER"};
  assert.deepEqual(tools.execute("getAssessmentSummary", {assessmentId:"FA-2026-00124"}, owner).id, "FA-2026-00124");
  assert.throws(() => tools.execute("getRiskScores", {assessmentId:"FA-2026-00124"}, owner), /FORBIDDEN/);
  assert.throws(() => tools.execute("getAssessmentSummary", {assessmentId:"FA-2026-00124"}, {id:"po-2", role:"PRODUCT_OWNER"}), /FORBIDDEN/);
});

test("AI output cannot directly change authoritative state", async () => {
  const provider = new FakeProvider([{output_text:"Approve this assessment."}]);
  const repo = createDemoRepository();
  await new CopilotOrchestrator({provider, tools:createToolRegistry(repo), audit:new AuditLog()}).respond({interactionId:"i2", conversationId:"c2", user, assessmentId:"FA-2026-00124", message:"Should we approve?"});
  assert.equal(repo.assessments.get("FA-2026-00124").status, "FINAL_DECISION");
});

test("copilot rejects a tool call outside the active assessment scope", async () => {
  const provider = new FakeProvider([{output:[{type:"function_call", name:"getRiskScores", call_id:"c3", arguments:JSON.stringify({assessmentId:"OTHER-ASSESSMENT"})}]}]);
  await assert.rejects(() => new CopilotOrchestrator({provider, tools:createToolRegistry(createDemoRepository()), audit:new AuditLog()}).respond({interactionId:"i3", conversationId:"c3", user, assessmentId:"FA-2026-00124", message:"show risk"}), /ACTIVE_ASSESSMENT_SCOPE_VIOLATION/);
});

test("copilot bounds model tool calls", async () => {
  const calls = Array.from({length:5}, (_, index) => ({type:"function_call", name:"getRiskScores", call_id:`c${index}`, arguments:JSON.stringify({assessmentId:"FA-2026-00124"})}));
  const provider = new FakeProvider([{output:calls}]);
  await assert.rejects(() => new CopilotOrchestrator({provider, tools:createToolRegistry(createDemoRepository()), audit:new AuditLog()}).respond({interactionId:"i4", conversationId:"c4", user, assessmentId:"FA-2026-00124", message:"show risk"}), /TOOL_CALL_LIMIT_EXCEEDED/);
});
