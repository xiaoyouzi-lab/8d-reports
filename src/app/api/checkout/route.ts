import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createCheckoutSession } from "@/lib/creem";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const { planType } = body;

  const productId = planType === "yearly"
    ? process.env.CREEM_PRODUCT_YEARLY
    : process.env.CREEM_PRODUCT_MONTHLY;

  if (!productId) {
    return NextResponse.json(
      { error: `${planType === "yearly" ? "Yearly" : "Monthly"} product is not configured` },
      { status: 503 }
    );
  }

  try {
    const origin = req.headers.get("origin") || process.env.BETTER_AUTH_URL || "https://8d-reports.vercel.app";
    const session = await createCheckoutSession({
      productId,
      userId: user.id,
      customerEmail: user.email,
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancelled`,
    });
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
