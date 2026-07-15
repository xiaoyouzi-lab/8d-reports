import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { claimCompletedQualityCaseTask } from "@/lib/quality-cases/external-tasks";
export const dynamic = "force-dynamic";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { token } = await params;
  const result = await claimCompletedQualityCaseTask(token, user.id);
  return result.ok
    ? NextResponse.json(result.value)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
