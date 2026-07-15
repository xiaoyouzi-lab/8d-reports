import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { revokeQualityCaseTask } from "@/lib/quality-cases/external-tasks";
export const dynamic = "force-dynamic";
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id, taskId } = await params;
  const result = await revokeQualityCaseTask({
    caseId: id,
    taskId,
    userId: user.id,
  });
  return result.ok
    ? NextResponse.json(result.value)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
