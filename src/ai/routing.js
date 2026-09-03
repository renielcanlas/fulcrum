const ROUTES = {
  FAST: "FAST",
  REASONING: "REASONING",
  DOCUMENT_INTELLIGENCE: "DOCUMENT_INTELLIGENCE",
  DETERMINISTIC: "DETERMINISTIC"
};

const ROUTING = new Map([
  ["required-field-validation", ROUTES.DETERMINISTIC],
  ["document-structure-extraction", ROUTES.DOCUMENT_INTELLIGENCE],
  ["jira-summary", ROUTES.FAST],
  ["fact-extraction", ROUTES.FAST],
  ["gap-detection", ROUTES.FAST],
  ["policy-retrieval", ROUTES.DETERMINISTIC],
  ["policy-synthesis", ROUTES.REASONING],
  ["risk-analysis", ROUTES.REASONING],
  ["risk-scoring", ROUTES.DETERMINISTIC],
  ["control-assessment", ROUTES.FAST],
  ["assessment-draft", ROUTES.REASONING],
  ["change-impact", ROUTES.FAST],
  ["committee-package", ROUTES.REASONING],
  ["conversational-qa", ROUTES.FAST]
]);

export function routeForTask(taskType, {complexity = "STANDARD", contextSize = "SMALL", material = false} = {}) {
  const base = ROUTING.get(taskType);
  if (!base) throw new Error(`UNKNOWN_TASK_ROUTE_${taskType}`);
  if (base === ROUTES.FAST && (complexity === "HIGH" || contextSize === "LARGE" || material)) return ROUTES.REASONING;
  return base;
}

export function routingTable() { return Object.fromEntries(ROUTING); }

export {ROUTES};
