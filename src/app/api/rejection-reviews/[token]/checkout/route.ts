import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { RejectionReviewProviderError } from "@/lib/rejection-review/creem-payment";
import { RejectionReviewPaymentError, startRejectionReviewCheckout } from "@/lib/rejection-review/payment";
import { REJECTION_REVIEW_RETURN_COOKIE } from "@/lib/rejection-review/payment-policy";

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
    const checkout = await startRejectionReviewCheckout({
      token,
      user: { id: user.id, email: user.email },
    });
    const response = NextResponse.json({
      order_id: checkout.orderId,
      status: checkout.status,
      checkout_url: checkout.checkoutUrl,
      price_variant: checkout.priceVariant,
      price_cents: checkout.priceCents,
      currency: checkout.currency,
    }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(REJECTION_REVIEW_RETURN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/8d-report-review-service",
      maxAge: 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    if (error instanceof RejectionReviewPaymentError || error instanceof RejectionReviewProviderError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Rejection Review checkout failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Checkout is temporarily unavailable", code: "checkout_failed" }, { status: 503 });
  }
}
