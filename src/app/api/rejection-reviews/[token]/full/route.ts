import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { getPaidRejectionReviewResult, RejectionReviewPaymentError } from "@/lib/rejection-review/payment";

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
    return NextResponse.json(
      await getPaidRejectionReviewResult({ token, userId: user.id }),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof RejectionReviewPaymentError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "The complete review is temporarily unavailable" }, { status: 503 });
  }
}
