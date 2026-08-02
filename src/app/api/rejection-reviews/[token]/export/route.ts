import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import {
  getPaidRejectionReviewResult,
  recordRejectionReviewExport,
  RejectionReviewPaymentError,
} from "@/lib/rejection-review/payment";
import {
  generateRejectionReviewWordPackage,
  rejectionReviewFilename,
} from "@/lib/rejection-review/word-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { token } = await params;
  try {
    const delivered = await getPaidRejectionReviewResult({ token, userId: user.id });
    const buffer = await generateRejectionReviewWordPackage({
      reviewId: delivered.orderId,
      generatedAt: new Date(),
      review: delivered.result.review,
      rewrites: delivered.result.rewrites,
    });
    await recordRejectionReviewExport({ orderId: delivered.orderId, userId: user.id });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${rejectionReviewFilename(delivered.orderId)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RejectionReviewPaymentError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "The review download is temporarily unavailable" }, { status: 503 });
  }
}
