import {runtime} from "../../../../src/server/runtime.js";
import {DEMO_USERS, findDemoUser} from "../../../../src/auth/demo-users.js";
import {validateJiraScenario} from "../../../../src/integrations/jira-scenario.js";

export const maxDuration = 60;
const ALLOWED_ACTIONS = new Set(["create", "update", "transition", "assign", "comment", "delete_all"]);
const ACTION_ALIASES = {create_issue: "create", add_comment: "comment", move: "transition", delete_all_issues: "delete_all"};
const INSTRUCTIONS = `You draft synthetic Jira sandbox scenarios for FULCRUM. Return only valid JSON, with no markdown and no Chinese, Japanese, or other localized field names or error text. The root object must contain name, description, projectKey "FCRM", and a steps array. Each step must contain id, label, and one supported action: create, update, transition, assign, comment, or delete_all. Use synthetic data only. Do not include credentials, tokens, arbitrary URLs, real customer data, or direct execution instructions. The FCRM workflow statuses are Intake → Context and Research → Risk Assessment → Review → Decision. For transition steps, use the English target in a "status" field and keep transitions in workflow order; the server resolves the actual transition ID. Create steps may use only summary, description, issueType "Task", and labels. Update steps may use only summary, description, priority with a name, labels, or assigneePersona using a persona code from the catalog. Assign steps must use personaId using a persona code from the catalog. Comment steps must use a plain-text body. Do not invent Jira custom fields such as ResearchOwner or ResearchPriority, do not use Notes or arbitrary field names, and never guess customfield IDs or Atlassian account IDs. If a required custom field or live assignee mapping is unknown, omit that step and explain the limitation in the scenario description. Keep the scenario minimal, ordered, and executable against the existing FCRM project.`;
const SCENARIO_FORMAT = {format: {type: "json_object"}};
const SUPPORTED_UPDATE_FIELDS = new Set(["summary", "description", "priority", "labels", "assignee", "assigneePersona", "duedate"]);
const PERSONA_CONTEXT = DEMO_USERS.map(({id, displayName, role}) => `${id}: ${displayName} (${role}; synthetic FULCRUM persona)`).join("\n");
const EXECUTION_CONTEXT = `FULCRUM sandbox execution contract: project FCRM only; synthetic data only; supported actions are create, update, transition, assign, comment, and delete_all; create fields are summary, description, issueType Task, and labels; update fields are summary, description, priority, labels, assigneePersona, or duedate; comments use body; transitions use English status intents in workflow order: Intake, Context and Research, Risk Assessment, Review, Decision. Use personaId for assign steps and assigneePersona for update steps. Never invent custom fields, custom field IDs, localized field names, usernames, arbitrary URLs, or unsupported actions. The persona catalog below contains the only valid persona codes. If assignment is requested, use one of those codes; the server resolves it to the verified Atlassian account ID. If the request requires an unavailable permission or unknown Jira field, omit that step and explain the limitation instead.\n\nSynthetic persona catalog:\n${PERSONA_CONTEXT}`;

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
    if (step.action === "update" && !step.fields) { const updateFields = {...step}; ["id", "label", "action"].forEach((field) => delete updateFields[field]); step.fields = updateFields; }
    if (step.action === "transition" && !step.status && (step.to || step.intent || step.targetStatus)) step.status = step.to ?? step.intent ?? step.targetStatus;
    if (step.action === "update" && step.fields && typeof step.fields === "object") {
      const unsupportedFields = Object.keys(step.fields).filter((field) => !SUPPORTED_UPDATE_FIELDS.has(field) && !/^customfield_[0-9]+$/.test(field));
      if (unsupportedFields.length) throw new Error(`invalid_scenario_unsupported_fields_${unsupportedFields.join(",")}`);
      if (step.fields.assignee) throw new Error("invalid_scenario_persona_code_required");
      if (step.fields.assigneePersona && !findDemoUser(step.fields.assigneePersona)) throw new Error("invalid_scenario_persona_id");
    }
    if (step.action === "assign" && step.accountId) throw new Error("invalid_scenario_persona_code_required");
    if (step.action === "assign" && !step.personaId) throw new Error("invalid_scenario_persona_id");
    if (step.action === "assign" && step.personaId && !findDemoUser(step.personaId)) throw new Error("invalid_scenario_persona_id");
    if (step.action === "delete_all") throw new Error("invalid_scenario_destructive_action");
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
    const input = existingScenario ? `${EXECUTION_CONTEXT}\n\nUser request:\n${body.message.trim()}\n\nModify this existing scenario as context. Preserve valid parts unless the request changes them. Return the complete revised scenario JSON. Return JSON only:\n${existingScenario.slice(0, 20000)}` : `${EXECUTION_CONTEXT}\n\nUser request:\n${body.message.trim()}\n\nCreate a new scenario from scratch. Return JSON only.`;
    if (body.draftOnly) {
      const result = await runtime.provider.generateResponse({instructions: INSTRUCTIONS, input, text: SCENARIO_FORMAT});
      const output = getResponseText(result);
      return Response.json({ok: true, raw: output, responseId: result.id ?? null});
    }
    let output = "";
    let lastError = "scenario_generation_failed";
    let previousResponseId = body.previousResponseId;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const repairInput = attempt === 0 ? input : `${input}\n\nThe previous response failed deterministic validation. Repair it and return the complete scenario JSON only. Validation failure: ${lastError}\nPrevious response:\n${output.slice(0, 20000)}`;
      const result = await runtime.provider.generateResponse({instructions: INSTRUCTIONS, input: repairInput, text: SCENARIO_FORMAT, previousResponseId});
      previousResponseId = result.id ?? previousResponseId;
      output = getResponseText(result);
      try {
        const scenario = parseScenario(output);
        const validation = validateJiraScenario(scenario);
        if (!validation.valid) throw new Error(validation.errors.join("; "));
        return Response.json({ok: true, scenario, raw: output, validation, responseId: result.id ?? previousResponseId});
      } catch (error) {
        lastError = error.message ?? "scenario_validation_failed";
      }
    }
    throw new Error(`invalid_scenario_after_repair: ${lastError}`);
  } catch (error) {
    const errorCode = error.message === "Unexpected end of JSON input" ? "invalid_scenario_empty_or_incomplete_response" : error.message ?? "scenario_generation_failed";
    return Response.json({error: errorCode, hint: "Azure must return a complete JSON scenario. Check the model deployment and try again."}, {status: 502});
  }
}
