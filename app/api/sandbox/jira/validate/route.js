import {validateJiraScenario} from "../../../../../src/integrations/jira-scenario.js";

export async function POST(request) {
  try {
    const scenario = await request.json();
    const validation = validateJiraScenario(scenario);
    return Response.json(validation, {status: validation.valid ? 200 : 400});
  } catch {
    return Response.json({valid: false, errors: ["scenario_json_required"]}, {status: 400});
  }
}
