import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { convertP0PlusPreviewToReport } from "@/lib/p0-plus/convert";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const user = await getSessionUser();
  const result = await convertP0PlusPreviewToReport({ token, user });
  return NextResponse.json(result.body, { status: result.status });
}
