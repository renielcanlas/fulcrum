import {runtime} from "../../../../src/server/runtime.js";

export const maxDuration = 60;
const ALLOWED_ACTIONS = new Set(["create", "update", "transition", "assign", "comment", "delete_all"]);
const ACTION_ALIASES = {create_issue: "create", add_comment: "comment", move: "transition", delete_all_issues: "delete_all"};
const INSTRUCTIONS = `You draft synthetic Jira sandbox scenarios for FULCRUM. Return only valid JSON, with no markdown. The root object must contain name, description, projectKey "FCRM", and a steps array. Each step must contain id, label, and one supported action: create, update, transition, assign, comment, or delete_all. Use synthetic data only. Do not include credentials, tokens, arbitrary URLs, real customer data, or direct execution instructions. The FCRM workflow statuses are Intake → Context and Research → Risk Assessment → Review → Decision. In this Jira site, Review may be localized as 审查 and Decision may be localized as 决策. For transitions, use one of those English intent names, keep transitions in workflow order, and remember that Jira may permit only some targets from an issue's current state; the server resolves the actual transition ID and localized status alias. Keep the scenario minimal and ordered. Do not invent Jira custom fields such as ResearchOwner or ResearchPriority, and do not use arbitrary field names in update steps. Use only known Jira fields (summary, description, priority, labels, or assignee with a valid accountId). Represent notes as a comment or description. If a required custom field is unknown, omit the update rather than guessing its field ID.`;
const SCENARIO_FORMAT = {format: {type: "json_object"}};

function parseScenario(output) {
  const candidate = output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const scenario = JSON.parse(candidate);
  if (!scenario || typeof scenario !== "object" || !Array.isArray(scenario.steps)) throw new Error("invalid_scenario_shape");
  scenario.projectKey = "FCRM";
  scenario.steps.forEach((step, index) => {
    if (!step || typeof step !== "object") throw new Error(`invalid_scenario_step_${index + 1}`);
    if (!step.action) {
      const actionKey = Object.keys(step).find((key) => ALLOWED_ACTIONS.has(key) || ACTION_ALIASES[key]);
      if (actionKey) {
        step.action = ACTION_ALIASES[actionKey] ?? actionKey;
        if (step[actionKey] && typeof step[actionKey] === "object" && !Array.isArray(step[actionKey])) Object.assign(step, step[actionKey]);
        delete step[actionKey];
      }
    }
    step.action = ACTION_ALIASES[step.action] ?? step.action;
    if (step.action === "transition" && !step.status && (step.to || step.intent || step.targetStatus)) step.status = step.to ?? step.intent ?? step.targetStatus;
    step.id = step.id === undefined ? `step-${index + 1}` : String(step.id);
    step.label = step.label === undefined ? step.action : String(step.label);
    if (!step.id || !step.label || !ALLOWED_ACTIONS.has(step.action)) throw new Error(`invalid_scenario_step_${index + 1}`);
  });
  return scenario;
}

function getResponseText(result) {
  if (typeof result?.output_text === "string") return result.output_text;
  return (result?.output ?? []).flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" || item.type === "text").map((item) => item.text ?? "").join("\n");
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.message?.trim()) return Response.json({error: "message_required"}, {status: 400});
    const existingScenario = typeof body.currentScenario === "string" ? body.currentScenario.trim() : "";
    const input = existingScenario ? `${body.message.trim()}\n\nModify this existing scenario as context. Preserve valid parts unless the request changes them. Return the complete revised scenario JSON. Return JSON only:\n${existingScenario.slice(0, 20000)}` : `${body.message.trim()}\n\nCreate a new scenario from scratch. Return JSON only.`;
    const result = await runtime.provider.generateResponse({instructions: INSTRUCTIONS, input, text: SCENARIO_FORMAT});
    const output = getResponseText(result);
    const scenario = parseScenario(output);
    return Response.json({ok: true, scenario, raw: output});
  } catch (error) {
    const errorCode = error.message === "Unexpected end of JSON input" ? "invalid_scenario_empty_or_incomplete_response" : error.message ?? "scenario_generation_failed";
    return Response.json({error: errorCode, hint: "Azure must return a complete JSON scenario. Check the model deployment and try again."}, {status: 502});
  }
}
