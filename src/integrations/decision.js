export const DECISION_MARKER = "<!-- fulcrum-decision:v1 -->";
export const DECISION_OUTCOMES = Object.freeze({
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
});
const outcomeLabels = { ACCEPTED: "Accepted", REJECTED: "Rejected" };
function text(value) { return typeof value === "string" ? value.trim() : ""; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")); }

export function validateDecision(input, {actorId, actorName, actorRole, evaluation} = {}) {
  const outcome = text(input?.outcome);
  if (!Object.values(DECISION_OUTCOMES).includes(outcome)) throw new Error("decision_outcome_invalid");
  const rationale = text(input?.rationale);
  if (rationale.length < 10) throw new Error("decision_rationale_required");
  const conditions = Array.isArray(input?.conditions) ? input.conditions.map((condition) => ({description: text(condition?.description), owner: text(condition?.owner), dueDate: text(condition?.dueDate), status: "OPEN", evidence: text(condition?.evidence)})) : [];
  if (conditions.length > 0) throw new Error("decision_conditions_not_supported");
  return {version: "fulcrum-decision-v1", outcome, label: outcomeLabels[outcome], rationale, conditions, actor: {id: actorId ?? null, name: actorName ?? "Unknown", role: actorRole ?? null}, evaluation: {stage: evaluation?.stage ?? "Review", revision: evaluation?.revision ?? null, weightedScore: evaluation?.weightedDecision?.score ?? evaluation?.score ?? null, recommendation: evaluation?.weightedDecision?.recommendation ?? evaluation?.recommendation ?? null}, decidedAt: new Date().toISOString()};
}

function parseComment(comment) {
  const line = String(comment.body ?? "").split("\n").find((value) => value.startsWith("FULCRUM_DECISION_JSON:"));
  if (!line) return {commentId: comment.id, publishedAt: comment.created ?? null};
  try { return {...JSON.parse(line.slice("FULCRUM_DECISION_JSON:".length)), commentId: comment.id, publishedAt: comment.created ?? null}; }
  catch { return {commentId: comment.id, publishedAt: comment.created ?? null}; }
}

export function parsePublishedDecisions(comments = []) { return comments.filter((comment) => String(comment.body ?? "").includes(DECISION_MARKER)).map(parseComment).sort((left, right) => String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? ""))); }

export function formatDecisionComment(decision) {
  const conditions = decision.conditions?.length ? decision.conditions.map((condition, index) => `${index + 1}. ${condition.description} — owner: ${condition.owner}; due: ${condition.dueDate}; status: ${condition.status}${condition.evidence ? `; evidence: ${condition.evidence}` : ""}`).join("\n") : "None.";
  return `${DECISION_MARKER}\nFULCRUM human decision\nOutcome: ${decision.label}\nDecision owner: ${decision.actor?.name ?? "Unknown"}\nRationale: ${decision.rationale}\nWeighted evaluation: ${decision.evaluation?.weightedScore ?? "Unknown"}\nEvaluation recommendation: ${decision.evaluation?.recommendation ?? "Unknown"}\n\nConditions:\n${conditions}\n\nFULCRUM_DECISION_JSON:${JSON.stringify(decision)}`;
}
