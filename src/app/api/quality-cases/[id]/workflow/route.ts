import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { isQualityCaseAction, transitionQualityCase } from "@/lib/quality-cases/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!isQualityCaseAction(body.action)) {
    return NextResponse.json({ error: "Invalid Quality Case action." }, { status: 400 });
  }
  const result = await transitionQualityCase({
    caseId: id,
    actor: user,
    action: body.action,
    comment: body.comment,
    requestedFieldIds: body.requestedFieldIds,
    newDueAt: body.newDueAt,
    evidenceIds: body.evidenceIds,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.value);
}
