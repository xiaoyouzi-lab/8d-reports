import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createEightDOutput } from "@/lib/quality-cases/outputs";
export const dynamic = "force-dynamic";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await createEightDOutput({
    caseId: id,
    user,
    languageMode: body.languageMode,
  });
  return result.ok
    ? NextResponse.json(result.value, { status: 201 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
