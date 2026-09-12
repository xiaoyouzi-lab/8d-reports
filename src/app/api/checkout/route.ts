import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createCheckoutSession } from "@/lib/creem";
import { getCheckoutLabel, getConfiguredProductId, isCheckoutType } from "@/lib/plans";
import { FOUNDING_CASE_PRICE_CENTS } from "@/lib/plans";
import { getAccessibleReport } from "@/lib/report-access";
import {
  createOrReuseFoundingCasePurchase,
  markFoundingCaseCheckoutFailed,
  restartFoundingCasePurchase,
  saveFoundingCaseCheckout,
} from "@/lib/revenue/founding-case";
import { recordRevenueFunnelEvent } from "@/lib/revenue/funnel";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const { planType, reportId, previewToken } = body;

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

  if (planType === "founding_case" && (typeof previewToken !== "string" || previewToken.length < 20)) {
    return NextResponse.json({ error: "A valid quality preview is required." }, { status: 400 });
  }

  const productId = getConfiguredProductId(planType);

  if (!productId) {
    return NextResponse.json(
      { error: `${getCheckoutLabel(planType)} product is not configured` },
      { status: 503 }
    );
  }

  try {
    const origin = req.nextUrl.origin;
    if (planType === "founding_case") {
      const started = await createOrReuseFoundingCasePurchase({
        user: { id: user.id, email: user.email },
        previewToken,
      });
      if (!started.ok) {
        return NextResponse.json({ error: started.error }, { status: started.status });
      }
      let { purchase } = started.value;
      const preview = started.value.preview;
      if (purchase.status === "paid" && purchase.caseId) {
        return NextResponse.json({
          purchaseId: purchase.id,
          continue_url: `${origin}/founding-case/continue?purchase=${purchase.id}`,
        });
      }
      if (purchase.status === "refunded" || purchase.status === "cancelled") {
        return NextResponse.json({ error: "This purchase is no longer active." }, { status: 409 });
      }
      if (purchase.status === "failed") {
        purchase = await restartFoundingCasePurchase(purchase.id) || purchase;
      }
      if (purchase.checkoutUrl) {
        return NextResponse.json({ checkout_url: purchase.checkoutUrl, purchaseId: purchase.id });
      }
      await recordRevenueFunnelEvent({
        eventName: "checkout_started",
        funnelId: preview.browserTokenHash || preview.clientIpHash,
        userId: user.id,
        previewId: preview.id,
        purchaseId: purchase.id,
        actorKind: purchase.customerKind as "owner" | "test" | "external",
        dedupeKey: `checkout_started:${purchase.id}`,
      });
      try {
        const session = await createCheckoutSession({
          productId,
          userId: user.id,
          customerEmail: user.email,
          requestId: purchase.providerRequestId,
          customPrice: FOUNDING_CASE_PRICE_CENTS,
          successUrl: `${origin}/founding-case/continue?purchase=${purchase.id}`,
          metadata: {
            checkoutType: "founding_case",
            purchaseId: purchase.id,
            previewId: preview.id,
          },
        });
        await saveFoundingCaseCheckout({
          purchaseId: purchase.id,
          providerCheckoutId: session.id,
          providerProductId: productId,
          checkoutUrl: session.checkout_url,
        });
        return NextResponse.json({ ...session, purchaseId: purchase.id });
      } catch (error) {
        await markFoundingCaseCheckoutFailed(purchase.id, "provider_checkout_failed");
        throw error;
      }
    }
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
