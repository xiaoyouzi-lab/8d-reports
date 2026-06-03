import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createCheckoutSession } from "@/lib/creem";
import { getCheckoutLabel, getConfiguredProductId, isCheckoutType } from "@/lib/plans";
import { getAccessibleReport } from "@/lib/report-access";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const { planType, reportId } = body;

  if (!isCheckoutType(planType)) {
    return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 });
  }

  if (planType === "single_report_export") {
    if (typeof reportId !== "string" || !reportId) {
      return NextResponse.json({ error: "Missing reportId for single report export" }, { status: 400 });
    }
    const report = await getAccessibleReport(reportId, user.id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
  }

  const productId = getConfiguredProductId(planType);

  if (!productId) {
    return NextResponse.json(
      { error: `${getCheckoutLabel(planType)} product is not configured` },
      { status: 503 }
    );
  }

  try {
    const origin = req.headers.get("origin") || process.env.BETTER_AUTH_URL || "https://8d-reports.com";
    const successPath = planType === "single_report_export" && typeof reportId === "string"
      ? `/reports/${reportId}?checkout=single_export_success`
      : "/dashboard?checkout=success";
    const session = await createCheckoutSession({
      productId,
      userId: user.id,
      customerEmail: user.email,
      successUrl: `${origin}${successPath}`,
      metadata: {
        checkoutType: planType,
        ...(typeof reportId === "string" ? { reportId } : {}),
      },
    });
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
