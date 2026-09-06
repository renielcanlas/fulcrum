import config from "../../data/config/intake-assessment.json" with {type: "json"};

export const intakeAssessmentConfig = Object.freeze(config);
export const INTAKE_MARKER_PREFIX = "<!-- fulcrum-assessment:v1 stage=\"intake\"";
function valueAt(object, path) { return path.split(".").reduce((value, key) => value?.[key], object); }
export function pointsForIntakeState(state, weight) { if (state === "pass") return weight; if (state === "partial") return Math.round(weight * (intakeAssessmentConfig.scoring?.partialCreditFactor ?? 0.5)); return 0; }
export function intakeRecommendationForScore(score) { return (intakeAssessmentConfig.scoreBands ?? []).find((band) => score >= band.min && score <= band.max)?.label ?? (score >= intakeAssessmentConfig.recommendationThresholds.proceed ? "Proceed" : "Hold for remediation"); }
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
  const checks = intakeAssessmentConfig.checks.map((check) => { const result = evaluateCheck(check, item); return {id: check.id, label: check.label, weight: check.weight, state: result.state, points: pointsForIntakeState(result.state, check.weight), failure: result.state === "pass" ? null : check.failure}; });
  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const recommendation = intakeRecommendationForScore(score);
  return {version: intakeAssessmentConfig.version, stage: intakeAssessmentConfig.stage, assessedAt: now, score, maxScore: intakeAssessmentConfig.checks.reduce((sum, check) => sum + check.weight, 0), recommendation, scoring: intakeAssessmentConfig.scoring, scoreBands: intakeAssessmentConfig.scoreBands, checks, source: {issueKey: item.key, updated: item.updated ?? null}};
}
function parsePublishedComment(comment) { const jsonLine = String(comment.body ?? "").split("\n").find((line) => line.startsWith("FULCRUM_ASSESSMENT_JSON:")); if (!jsonLine) return {commentId: comment.id, publishedAt: comment.created ?? null}; try { return {...JSON.parse(jsonLine.slice("FULCRUM_ASSESSMENT_JSON:".length)), commentId: comment.id, publishedAt: comment.created ?? null}; } catch { return {commentId: comment.id, publishedAt: comment.created ?? null}; } }
export function parsePublishedAssessments(comments = []) { return comments.filter((comment) => String(comment.body ?? "").includes("<!-- fulcrum-assessment:")).map(parsePublishedComment).sort((left, right) => String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? ""))); }
export function parsePublishedIntakeAssessments(comments = []) { return comments.filter((comment) => String(comment.body ?? "").includes(INTAKE_MARKER_PREFIX)).map(parsePublishedComment).sort((left, right) => String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? ""))); }
export function parsePublishedIntakeAssessment(comments = []) { return parsePublishedIntakeAssessments(comments)[0] ?? null; }
export function formatIntakeAssessmentComment(assessment) {
  const failures = assessment.checks.filter((check) => check.state !== "pass").map((check) => `- ${check.label}: ${check.failure}`).join("\n") || "- All configured intake checks passed.";
  const ai = assessment.aiDecisionSupport;
  const weighted = assessment.weightedDecision ?? {score: assessment.score, maxScore: assessment.maxScore, recommendation: assessment.recommendation};
  const aiSection = ai?.proposedComment ? `\n\nAI decision support proposal (human review required)\nAutomatic decision: ${assessment.recommendation} (${assessment.score}/${assessment.maxScore})\nWeighted decision: ${weighted.recommendation} (${weighted.score}/${weighted.maxScore})\nDecision weighting: ${weighted.automaticPercent ?? 25}% automatic / ${weighted.aiPercent ?? 75}% AI\nAI weighted response: ${ai.recommendation} (${ai.score ?? "?"}/${ai.maxScore ?? assessment.maxScore})\nAI recommendation: ${ai.recommendation}\nAI response: ${ai.summary || ai.proposedComment}\nAI challenge: ${ai.challenge || "No additional challenge was returned."}\nAI confidence: ${Math.round((ai.confidence ?? 0) * 100)}%\n${ai.pros?.length ? `Potential benefits:\n${ai.pros.map((pro) => `- ${pro}`).join("\n")}\n` : ""}${ai.cons?.length ? `Risks and trade-offs:\n${ai.cons.map((con) => `- ${con}`).join("\n")}\n` : ""}${ai.rationale?.length ? `AI rationale:\n${ai.rationale.map((reason) => `- ${reason}`).join("\n")}\n` : ""}${ai.checkReviews?.length ? `AI checklist review:\n${ai.checkReviews.map((check) => `- ${check.label ?? check.checkId}: ${check.state} (${check.points}/${check.weight}) — ${check.observation}`).join("\n")}\n` : ""}${ai.proposedComment}` : "";
  return `${INTAKE_MARKER_PREFIX} version=\"${assessment.version}\" -->\nFULCRUM Intake assessment\nScore: ${assessment.score}/${assessment.maxScore}\nRecommendation: ${assessment.recommendation}\n\nChecks:\n${assessment.checks.map((check) => `- ${check.label}: ${check.state} (${check.points}/${check.weight})`).join("\n")}\n\nOpen items:\n${failures}${aiSection}\n\nFULCRUM_ASSESSMENT_JSON:${JSON.stringify(assessment)}`;
}
