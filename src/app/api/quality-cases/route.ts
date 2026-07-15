import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createQualityCase, listQualityCases } from "@/lib/quality-cases/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  try {
    return NextResponse.json(await listQualityCases(user.id));
  } catch (error) {
    console.error("Quality Case list failed", error);
    return NextResponse.json({ error: "Quality Cases are temporarily unavailable. Please try again later." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const body = await req.json().catch(() => ({}));
  const result = await createQualityCase(user, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.value, { status: 201 });
}
