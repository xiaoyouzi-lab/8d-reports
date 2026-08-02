import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { recordRejectionReviewRefundRequest, RejectionReviewPaymentError } from "@/lib/rejection-review/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { token } = await params;
  try {
    return NextResponse.json(
      await recordRejectionReviewRefundRequest({ token, userId: user.id }),
      { status: 202, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof RejectionReviewPaymentError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Refund request could not be recorded" }, { status: 503 });
  }
}
