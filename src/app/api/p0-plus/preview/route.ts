import { NextRequest, NextResponse } from "next/server";
import { isP0PlusPreviewEnabled } from "@/lib/p0-plus/config";
import { createP0PlusPreview } from "@/lib/p0-plus/preview-service";
import { getForwardedIp } from "@/lib/p0-plus/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isP0PlusPreviewEnabled()) {
    return NextResponse.json(
      { error: "P0+ preview is not enabled", code: "p0_plus_preview_disabled" },
      { status: 404 },
    );
  }

  const contentLength = req.headers.get("content-length");
  const bodyBytes = contentLength ? Number(contentLength) : null;
  const body = await req.json().catch(() => ({}));
  const browserToken = req.headers.get("x-p0-plus-browser-token")
    || (typeof body?.browserToken === "string" ? body.browserToken : null);

  const result = await createP0PlusPreview({
    body,
    bodyBytes: Number.isFinite(bodyBytes) ? bodyBytes : null,
    clientIp: getForwardedIp(req.headers),
    browserToken,
  });

  return NextResponse.json(result.body, { status: result.status });
}
