import config from "../../data/config/stage-evaluations.json" with {type: "json"};

export const stageEvaluationConfig = Object.freeze(config);
export const evaluationStages = Object.freeze(Object.keys(config.stages));
const marker = "<!-- fulcrum-evaluation:v1";
function valueAt(object, path) { return path.split(".").reduce((value, key) => value?.[key], object); }
function evaluateCheck(check, item) {
  const value = valueAt(item, check.path);
  if (check.kind === "equals") return value === check.value ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"};
  if (check.kind === "present") return value !== null && value !== undefined && String(value).trim() ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"};
  if (check.kind === "textLength") { const length = typeof value === "string" ? value.trim().length : 0; if (length >= check.full) return {points: check.weight, state: "pass"}; if (length >= check.partial) return {points: Math.round(check.weight / 2), state: "partial"}; return {points: 0, state: "fail"}; }
  if (check.kind === "arrayMin") return Array.isArray(value) && value.length >= check.minimum ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"};
  if (check.kind === "commentMin") { const count = Array.isArray(value) ? value.filter((comment) => !String(comment.body ?? "").includes("fulcrum-")).length : 0; return count >= check.minimum ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"}; }
  return {points: 0, state: "fail"};
}
export function getStageEvaluationConfig(stage) { return config.stages[stage] ?? null; }
export function evaluateStage(item, stage, now = new Date().toISOString()) {
  const definition = getStageEvaluationConfig(stage);
  if (!definition) throw new Error("unsupported_evaluation_stage:" + stage);
  const checks = definition.checks.map((check) => { const result = evaluateCheck(check, item); return {id: check.id, label: check.label, weight: check.weight, state: result.state, points: result.points, failure: result.state === "pass" ? null : check.failure}; });
  const score = checks.reduce((sum, check) => sum + check.points, 0);
  return {version: config.version, stage, title: definition.title, assessedAt: now, score, maxScore: definition.checks.reduce((sum, check) => sum + check.weight, 0), recommendation: score >= definition.recommendationThresholds.proceed ? "Proceed" : "Hold for remediation", checks, source: {issueKey: item.key, updated: item.updated ?? null}};
}
function parseComment(comment) { const jsonLine = String(comment.body ?? "").split("\n").find((line) => line.startsWith("FULCRUM_EVALUATION_JSON:")); if (!jsonLine) return {commentId: comment.id, publishedAt: comment.created ?? null}; try { return {...JSON.parse(jsonLine.slice("FULCRUM_EVALUATION_JSON:".length)), commentId: comment.id, publishedAt: comment.created ?? null}; } catch { return {commentId: comment.id, publishedAt: comment.created ?? null}; } }
export function parsePublishedStageEvaluations(comments = [], stage) { return comments.filter((comment) => String(comment.body ?? "").includes(marker + " stage=\"" + stage + "\"")).map(parseComment).sort((left, right) => String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? ""))); }
export function formatStageEvaluationComment(evaluation) { const failures = evaluation.checks.filter((check) => check.state !== "pass").map((check) => "- " + check.label + ": " + check.failure).join("\n") || "- All configured checks passed."; return marker + " stage=\"" + evaluation.stage + "\" version=\"" + evaluation.version + "\" -->\nFULCRUM " + evaluation.stage + " evaluation\nScore: " + evaluation.score + "/" + evaluation.maxScore + "\nRecommendation: " + evaluation.recommendation + "\n\nChecks:\n" + evaluation.checks.map((check) => "- " + check.label + ": " + check.state + " (" + check.points + "/" + check.weight + ")").join("\n") + "\n\nOpen items:\n" + failures + "\n\nFULCRUM_EVALUATION_JSON:" + JSON.stringify(evaluation); }
