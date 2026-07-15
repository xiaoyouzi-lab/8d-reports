import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";
import { GuidedInvestigatorError, runGuidedInvestigator } from "@/lib/quality-cases/guided-investigator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/quality-cases/[id]/guidance/investigator">) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await context.params;
  const access = await getQualityCaseAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "Quality Case not found." }, { status: 404 });
  if (!access.canEdit) return NextResponse.json({ error: "You do not have permission to run the Quality Investigator." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (![body.sessionId, body.questionId, body.answerId].every((value) => typeof value === "string" && value.length > 0 && value.length < 100)) {
    return NextResponse.json({ error: "sessionId, questionId, and answerId are required." }, { status: 400 });
  }
  try {
    return NextResponse.json(await runGuidedInvestigator({ caseId: id, sessionId: body.sessionId, questionId: body.questionId, answerId: body.answerId, actorId: user.id }));
  } catch (error) {
    const safe = error instanceof GuidedInvestigatorError ? error : new GuidedInvestigatorError("AI Quality Investigator is temporarily unavailable");
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
