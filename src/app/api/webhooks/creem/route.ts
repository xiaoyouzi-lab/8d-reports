import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyticsEvents, subscriptions, plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface CreemSubscriptionPayload {
  id?: string;
  product_id?: string;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  customer?: {
    external_id?: string;
  };
}

interface CreemWebhookEvent {
  type?: string;
  event?: string;
  subscription?: CreemSubscriptionPayload;
  data?: CreemSubscriptionPayload;
  customer?: {
    id?: string;
    external_id?: string;
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("creem-signature") || "";

  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (secret && signature) {
    // HMAC verification placeholder — implement proper HMAC-SHA256 in production
  }

  let event: CreemWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventType = event.type || event.event;

  try {
    if (eventType === "subscription.created" || eventType === "subscription.active") {
      const sub = event.subscription || event.data;
      const customerId = event.customer?.external_id || sub?.customer?.external_id;
      const subscriptionId = sub?.id;
      const productId = sub?.product_id;
      const status = sub?.status || "active";

      if (!customerId || !subscriptionId) {
        return NextResponse.json(
          { error: "Missing customer/subscription id" },
          { status: 400 }
        );
      }

      const planRow = productId
        ? (await db.select().from(plans).where(eq(plans.creemProductId, productId)).limit(1))[0]
        : null;

      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.creemSubscriptionId, subscriptionId))
        .limit(1);

      if (existing) {
        await db
          .update(subscriptions)
          .set({
            status,
            planId: planRow?.id ?? existing.planId,
            currentPeriodStart: sub?.current_period_start
              ? new Date(sub.current_period_start)
              : undefined,
            currentPeriodEnd: sub?.current_period_end
              ? new Date(sub.current_period_end)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existing.id));
      } else {
        await db.insert(subscriptions).values({
          userId: customerId,
          planId: planRow?.id ?? null,
          creemSubscriptionId: subscriptionId,
          creemCustomerId: event.customer?.id || "",
          status,
          currentPeriodStart: sub?.current_period_start
            ? new Date(sub.current_period_start)
            : new Date(),
          currentPeriodEnd: sub?.current_period_end
            ? new Date(sub.current_period_end)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }

      await db.insert(analyticsEvents).values({
        eventName: "checkout_completed",
        userId: customerId,
        plan: "pro",
        metadata: {
          subscriptionId,
          productId: productId || null,
          status,
        },
      }).catch(() => {});
    }

    if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
      const sub = event.subscription || event.data;
      const subscriptionId = sub?.id;
      if (subscriptionId) {
        await db
          .update(subscriptions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(subscriptions.creemSubscriptionId, subscriptionId));
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
