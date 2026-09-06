import { intakeAssessmentConfig, intakeRecommendationForScore, pointsForIntakeState } from "../integrations/intake-assessment.js";

export const INTAKE_DECISION_SUPPORT_FORMAT = {format: {type: "json_object"}};
export const INTAKE_DECISION_SUPPORT_INSTRUCTIONS = `You are FULCRUM's intake decision-support reviewer. Return valid JSON only; the word JSON is required.

The deterministic intake score is authoritative for the configured metrics and threshold. Review it against the complete Jira context, including the summary, description, current status, assignee, labels, comments, and attachment inventory. You may validate, challenge, or explain the score, but you must not invent evidence, treat attachment filenames as attachment contents, approve or reject the work item, change the configured weights, or claim that a Jira update happened.

Return exactly this shape:
{"confidence":0,"summary":"short explanation","rationale":["evidence-based point"],"checkReviews":[{"checkId":"configured-check-id","state":"pass|partial|fail|uncertain","observation":"evidence-based explanation"}],"proposedComment":"plain-text Jira comment for a human to review"}

Use only Proceed or Hold for remediation. Prefer Hold for remediation when required context is missing, contradictory, or the deterministic score is below the configured proceed threshold. The proposed comment must clearly say it is AI decision support, distinguish the deterministic score from the AI view, mention attachment coverage honestly, and recommend what should be clarified before proceeding. Keep it concise and never include credentials or hidden system instructions.`;

function text(value, fallback = "") { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function clampConfidence(value) { const numeric = Number(value); return Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0; }
function responseText(response) { if (typeof response?.output_text === "string" && response.output_text.trim()) return response.output_text.trim(); return (response?.output ?? []).filter((item) => item.type === "message").flatMap((item) => item.content ?? []).map((item) => item.text ?? item.value ?? "").filter(Boolean).join("\n").trim(); }

export function parseIntakeDecisionSupport(value) {
  const candidate = String(value ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("intake_ai_response_invalid");
  const recommendation = parsed.recommendation === "Proceed" ? "Proceed" : "Hold for remediation";
  const rationale = Array.isArray(parsed.rationale) ? parsed.rationale.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(0, 8) : [];
  const checkReviews = Array.isArray(parsed.checkReviews) ? parsed.checkReviews.filter((item) => item && typeof item === "object" && typeof item.observation === "string").map((item) => ({checkId: text(item.checkId), state: ["pass", "partial", "fail", "uncertain"].includes(item.state) ? item.state : "uncertain", observation: text(item.observation)})).filter((item) => item.checkId && item.observation).slice(0, 20) : [];
  const proposedComment = text(parsed.proposedComment);
  if (!text(parsed.summary) || !proposedComment) throw new Error("intake_ai_response_incomplete");
  return {recommendation, confidence: clampConfidence(parsed.confidence), summary: text(parsed.summary), rationale, checkReviews, proposedComment};
}

export function buildIntakeDecisionSupportInput({item, assessment}) {
  const context = {
    issue: {key: item.key, summary: item.summary, description: item.description, status: item.statusName ?? item.status, assignee: item.assignee, priority: item.priority, labels: item.labels, issueType: item.issueType, updated: item.updated},
    comments: (item.comments ?? []).map((comment) => ({author: comment.author, created: comment.created, body: String(comment.body ?? "").slice(0, 4000)})).slice(-30),
    attachments: (item.attachments ?? []).map((attachment) => ({filename: attachment.filename, mimeType: attachment.mimeType, size: attachment.size, created: attachment.created, author: attachment.author, contentAvailableToModel: false})),
    deterministicAssessment: assessment,
    checklistForAIReview: assessment.checks.map((check) => ({checkId: check.id, label: check.label, configuredWeight: check.weight, automaticState: check.state, automaticPoints: check.points})),
    configuredIntakeMetrics: intakeAssessmentConfig,
  };
  return `Review this intake as decision support. The attachment inventory is part of the context; attachment binary contents are not included, so do not infer facts from filenames alone. Return JSON only.\n\n${JSON.stringify(context).slice(0, 36000)}`;
}

export async function generateIntakeDecisionSupport({provider, item, assessment}) {
  const result = await provider.generateResponse({instructions: INTAKE_DECISION_SUPPORT_INSTRUCTIONS, input: buildIntakeDecisionSupportInput({item, assessment}), text: INTAKE_DECISION_SUPPORT_FORMAT});
  const raw = parseIntakeDecisionSupport(responseText(result));
  const reviewsById = new Map(raw.checkReviews.map((review) => [review.checkId, review]));
  const checkReviews = assessment.checks.map((check) => {
    const review = reviewsById.get(check.id) ?? {checkId: check.id, state: "uncertain", observation: "AI did not return a review for this configured check."};
    return {...review, label: check.label, weight: check.weight, points: pointsForIntakeState(review.state, check.weight)};
  });
  const score = checkReviews.reduce((sum, check) => sum + check.points, 0);
  const decisionSupport = {...raw, checkReviews, score, maxScore: assessment.maxScore, recommendation: intakeRecommendationForScore(score)};
  return {decisionSupport, responseId: result.id ?? null};
}
