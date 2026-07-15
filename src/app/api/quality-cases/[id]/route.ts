import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import {
  assignQualityCase,
  getQualityCaseDetail,
} from "@/lib/quality-cases/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  try {
    const detail = await getQualityCaseDetail(id, user.id);
    if (!detail) return NextResponse.json({ error: "Quality Case not found." }, { status: 404 });
    return NextResponse.json(detail);
  } catch (error) {
    console.error("Quality Case detail failed", error);
    return NextResponse.json({ error: "Quality Case is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await assignQualityCase({
    caseId: id,
    actor: user,
    assigneeUserId: body.assigneeUserId,
  });
  return result.ok
    ? NextResponse.json(result.value)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
