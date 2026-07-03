import { NextRequest, NextResponse } from "next/server";
import { getP0PlusPreview } from "@/lib/p0-plus/preview-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await getP0PlusPreview({ token });
  return NextResponse.json(result.body, { status: result.status });
}
