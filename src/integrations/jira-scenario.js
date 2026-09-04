import {findDemoUser} from "../auth/demo-users.js";

export const SCENARIO_ACTIONS = new Set(["create", "update", "transition", "assign", "comment", "delete_all"]);
const ACTION_ALIASES = {create_issue: "create", add_comment: "comment", move: "transition", delete_all_issues: "delete_all"};
const CREATE_FIELDS = new Set(["summary", "description", "issueType", "labels"]);
const UPDATE_FIELDS = new Set(["summary", "description", "priority", "labels", "assigneePersona", "duedate"]);
const WORKFLOW_STATUSES = new Set(["Intake", "Context and Research", "Risk Assessment", "Review", "Decision"]);
const MAX_STEPS = 50;

export function validateJiraScenario(scenario) {
  const errors = [];
  const warnings = [];
  if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) errors.push("scenario_must_be_an_object");
  if (!scenario?.steps || !Array.isArray(scenario.steps)) errors.push("scenario_steps_required");
  if (scenario?.projectKey && scenario.projectKey !== "FCRM") errors.push("scenario_project_must_be_FCRM");
  if (scenario?.steps?.length > MAX_STEPS) errors.push(`scenario_step_limit_${MAX_STEPS}`);
  for (const [index, step] of (scenario?.steps ?? []).entries()) {
    const label = `step_${index + 1}`;
    if (!step || typeof step !== "object") { errors.push(`${label}_must_be_an_object`); continue; }
    const actionKey = step.action ?? Object.keys(step).find((key) => SCENARIO_ACTIONS.has(key) || ACTION_ALIASES[key]);
    const action = ACTION_ALIASES[actionKey] ?? actionKey;
    const nestedAction = step[actionKey] && typeof step[actionKey] === "object" && !Array.isArray(step[actionKey]) ? step[actionKey] : null;
    const normalizedStep = nestedAction ? {...step, ...nestedAction, action} : {...step, action};
    if (!SCENARIO_ACTIONS.has(action)) { errors.push(`${label}_unsupported_action`); continue; }
    if (action === "create") { const createFields = {...(normalizedStep.fields ?? normalizedStep)}; ["id", "label", "action", "create", "create_issue"].forEach((field) => delete createFields[field]); validateFields(createFields, CREATE_FIELDS, label, errors); }
    if (action === "update") {
      const updateFields = normalizedStep.fields ?? (actionKey === "update" ? nestedAction : null);
      validateFields(updateFields, UPDATE_FIELDS, label, errors);
      if (normalizedStep.fields?.assigneePersona && !findDemoUser(normalizedStep.fields.assigneePersona)) errors.push(`${label}_unknown_persona`);
    }
    if (action === "assign" && !findDemoUser(normalizedStep.personaId)) errors.push(`${label}_unknown_persona`);
    if (action === "transition" && (!normalizedStep.status && !normalizedStep.to && !normalizedStep.intent && !normalizedStep.targetStatus)) errors.push(`${label}_transition_target_required`);
    if (action === "comment" && typeof normalizedStep.body !== "string") errors.push(`${label}_comment_body_required`);
    if (action === "delete_all") warnings.push(`${label}_destructive_action_requires_explicit_review`);
  }
  return {valid: errors.length === 0, errors, warnings, maxSteps: MAX_STEPS, stepCount: scenario?.steps?.length ?? 0};
}

function validateFields(fields, allowed, label, errors) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) { errors.push(`${label}_fields_required`); return; }
  const unknown = Object.keys(fields).filter((field) => !allowed.has(field));
  if (unknown.length) errors.push(`${label}_unsupported_fields_${unknown.join(",")}`);
}
