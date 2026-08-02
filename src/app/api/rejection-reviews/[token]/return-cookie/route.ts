import { NextResponse } from "next/server";
import { getRejectionReviewTaskByToken } from "@/lib/rejection-review/service";
import { REJECTION_REVIEW_RETURN_COOKIE } from "@/lib/rejection-review/payment-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const task = await getRejectionReviewTaskByToken(token);
  if (!task) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const response = NextResponse.json({ callbackPath: "/8d-report-review-service/continue-review" }, {
    headers: { "Cache-Control": "private, no-store" },
  });
  response.cookies.set(REJECTION_REVIEW_RETURN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/8d-report-review-service",
    maxAge: 24 * 60 * 60,
  });
  return response;
}
