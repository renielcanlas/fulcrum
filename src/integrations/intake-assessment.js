import config from "../../data/config/intake-assessment.json" with {type: "json"};

export const intakeAssessmentConfig = Object.freeze(config);
export const INTAKE_MARKER_PREFIX = "<!-- fulcrum-assessment:v1 stage=\"intake\"";
function valueAt(object, path) { return path.split(".").reduce((value, key) => value?.[key], object); }
function evaluateCheck(check, item) {
  const value = valueAt(item, check.path);
  if (check.kind === "equals") return value === check.value ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"};
  if (check.kind === "present") return value !== null && value !== undefined && String(value).trim() ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"};
  if (check.kind === "textLength") { const length = typeof value === "string" ? value.trim().length : 0; if (length >= check.full) return {points: check.weight, state: "pass"}; if (length >= check.partial) return {points: Math.round(check.weight / 2), state: "partial"}; return {points: 0, state: "fail"}; }
  if (check.kind === "arrayMin") return Array.isArray(value) && value.length >= check.minimum ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"};
  if (check.kind === "commentMin") { const count = Array.isArray(value) ? value.filter((comment) => !String(comment.body ?? "").includes("<!-- fulcrum-assessment:")).length : 0; return count >= check.minimum ? {points: check.weight, state: "pass"} : {points: 0, state: "fail"}; }
  return {points: 0, state: "fail"};
}
export function assessIntake(item, now = new Date().toISOString()) {
  const checks = intakeAssessmentConfig.checks.map((check) => { const result = evaluateCheck(check, item); return {id: check.id, label: check.label, weight: check.weight, state: result.state, points: result.points, failure: result.state === "pass" ? null : check.failure}; });
  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const recommendation = score >= intakeAssessmentConfig.recommendationThresholds.proceed ? "Proceed" : "Hold for remediation";
  return {version: intakeAssessmentConfig.version, stage: intakeAssessmentConfig.stage, assessedAt: now, score, maxScore: intakeAssessmentConfig.checks.reduce((sum, check) => sum + check.weight, 0), recommendation, checks, source: {issueKey: item.key, updated: item.updated ?? null}};
}
export function parsePublishedIntakeAssessment(comments = []) { const match = comments.slice().reverse().find((comment) => String(comment.body ?? "").includes(INTAKE_MARKER_PREFIX)); if (!match) return null; const jsonLine = String(match.body).split("\n").find((line) => line.startsWith("FULCRUM_ASSESSMENT_JSON:")); if (!jsonLine) return {commentId: match.id, publishedAt: match.created ?? null}; try { return {...JSON.parse(jsonLine.slice("FULCRUM_ASSESSMENT_JSON:".length)), commentId: match.id, publishedAt: match.created ?? null}; } catch { return {commentId: match.id, publishedAt: match.created ?? null}; } }
export function formatIntakeAssessmentComment(assessment) { const failures = assessment.checks.filter((check) => check.state !== "pass").map((check) => `- ${check.label}: ${check.failure}`).join("\n") || "- All configured intake checks passed."; return `${INTAKE_MARKER_PREFIX} version=\"${assessment.version}\" -->\nFULCRUM Intake assessment\nScore: ${assessment.score}/${assessment.maxScore}\nRecommendation: ${assessment.recommendation}\n\nChecks:\n${assessment.checks.map((check) => `- ${check.label}: ${check.state} (${check.points}/${check.weight})`).join("\n")}\n\nOpen items:\n${failures}\n\nFULCRUM_ASSESSMENT_JSON:${JSON.stringify(assessment)}`; }
