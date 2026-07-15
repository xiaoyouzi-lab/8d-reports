import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createQualityCaseDocumentOutput } from "@/lib/quality-cases/outputs";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await createQualityCaseDocumentOutput({
    caseId: id,
    user,
    languageMode: body.languageMode,
  });
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return new NextResponse(new Uint8Array(result.value.buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${result.value.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
