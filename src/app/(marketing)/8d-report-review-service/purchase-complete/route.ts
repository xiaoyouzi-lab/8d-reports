import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { validateRejectionReviewReturn } from "@/lib/rejection-review/payment";
import { REJECTION_REVIEW_RETURN_COOKIE } from "@/lib/rejection-review/payment-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const token = request.cookies.get(REJECTION_REVIEW_RETURN_COOKIE)?.value || "";
  const orderId = request.nextUrl.searchParams.get("review_order");
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", `/8d-report-review-service/purchase-complete?review_order=${encodeURIComponent(orderId || "")}`);
    return NextResponse.redirect(login);
  }
  const valid = token && orderId
    ? await validateRejectionReviewReturn({ token, userId: user.id, orderId })
    : false;
  const destination = valid
    ? new URL(`/8d-report-review-service/review/${encodeURIComponent(token)}?checkout=success`, request.url)
    : new URL("/8d-report-review-service?checkout=return_unavailable", request.url);
  const response = NextResponse.redirect(destination);
  response.cookies.delete(REJECTION_REVIEW_RETURN_COOKIE);
  return response;
}
