import {runtime} from "../../../../../src/server/runtime.js";
import {parseCookie} from "../../../../../src/auth/session.js";

const cookieName = "fulcrum_session";

export async function GET(request, {params}) {
  const {initiativeId} = await params;
  const user = runtime.sessions.get(parseCookie(request.headers.get("cookie") ?? "", cookieName));
  if (!user) return Response.json({error: "authentication_required"}, {status: 401});
  const assessment = [...runtime.repository.assessments.values()].find(item => item.initiativeId === initiativeId);
  if (!assessment) return Response.json({error: "initiative_not_found"}, {status: 404});
  try {
    return Response.json({
      initiative: runtime.tools.execute("getInitiativeSummary", {assessmentId: assessment.id}, user),
      lifecycle: assessment.lifecycle,
      sourceDocuments: runtime.tools.execute("getSourceDocuments", {assessmentId: assessment.id}, user),
      facts: runtime.tools.execute("getExtractedFacts", {assessmentId: assessment.id}, user),
      scoreCalculation: runtime.tools.execute("getScoreCalculation", {assessmentId: assessment.id}, user),
      traceability: runtime.tools.execute("getRiskTraceability", {assessmentId: assessment.id}, user),
      humanDispositions: runtime.tools.execute("getHumanDispositions", {assessmentId: assessment.id}, user),
      committee: runtime.tools.execute("getCommitteeDecision", {assessmentId: assessment.id}, user)
    });
  } catch (error) {
    return Response.json({error: error.message === "FORBIDDEN" ? "forbidden" : "trace_unavailable"}, {status: error.message === "FORBIDDEN" ? 403 : 500});
  }
}
