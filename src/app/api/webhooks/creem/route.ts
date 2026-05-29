import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { analyticsEvents, subscriptions, plans, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;

interface CreemCustomerPayload {
  id?: string;
  email?: string;
  external_id?: string;
}

interface CreemPayload {
  id?: string;
  type?: string;
  event?: string;
  eventType?: string;
  status?: string;
  product_id?: string;
  product?: { id?: string } | string;
  order?: { product?: string; customer?: string };
  subscription_id?: string;
  request_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  current_period_start_date?: string;
  current_period_end_date?: string;
  metadata?: JsonObject;
  customer?: CreemCustomerPayload;
  subscription?: CreemPayload;
  object?: CreemPayload;
  data?: CreemPayload;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function verifyCreemSignature(payload: string, signature: string | null) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const candidates = signature
    .split(",")
    .map((part) => part.trim().replace(/^sha256=/i, ""))
    .filter(Boolean);

  return candidates.some((candidate) => {
    try {
      const expectedBuffer = Buffer.from(expected, "hex");
      const candidateBuffer = Buffer.from(candidate, "hex");
      return expectedBuffer.length === candidateBuffer.length
        && timingSafeEqual(expectedBuffer, candidateBuffer);
    } catch {
      return false;
    }
  });
}

function getMetadataUserId(event: CreemPayload, sub?: CreemPayload) {
  const object = event.object;
  return asString(event.metadata?.userId)
    || asString(event.data?.metadata?.userId)
    || asString(object?.metadata?.userId)
    || asString(event.subscription?.metadata?.userId)
    || asString(sub?.metadata?.userId);
}

function getUserIdFromRequestId(event: CreemPayload) {
  const requestId = asString(event.request_id) || asString(event.object?.request_id);
  const match = requestId?.match(/^(.+)-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  return match?.[1];
}

function getCustomerEmail(event: CreemPayload, sub?: CreemPayload) {
  const object = event.object;
  return asString(event.customer?.email)
    || asString(event.data?.customer?.email)
    || asString(object?.customer?.email)
    || asString(object?.subscription?.customer?.email)
    || asString(event.subscription?.customer?.email)
    || asString(sub?.customer?.email);
}

function getCreemCustomerId(event: CreemPayload, sub?: CreemPayload) {
  const object = event.object;
  return asString(event.customer?.id)
    || asString(event.data?.customer?.id)
    || asString(object?.customer?.id)
    || asString(object?.subscription?.customer?.id)
    || asString(object?.order?.customer)
    || asString(event.subscription?.customer?.id)
    || asString(sub?.customer?.id)
    || "";
}

async function resolveUserId(event: CreemPayload, sub?: CreemPayload) {
  const object = event.object;
  const metadataUserId = getMetadataUserId(event, sub)
    || getUserIdFromRequestId(event)
    || asString(event.customer?.external_id)
    || asString(object?.customer?.external_id)
    || asString(sub?.customer?.external_id);
  if (metadataUserId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, metadataUserId))
      .limit(1);
    if (user) return user.id;
  }

  const email = getCustomerEmail(event, sub);
  if (!email) return null;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user?.id ?? null;
}

function getSubscriptionPayload(event: CreemPayload) {
  if (isObject(event.object?.subscription)) return event.object.subscription as CreemPayload;
  if (isObject(event.object) && asString((event.object as JsonObject).object) === "subscription") {
    return event.object as CreemPayload;
  }
  if (isObject(event.subscription)) return event.subscription as CreemPayload;
  if (isObject(event.data?.subscription)) return event.data.subscription as CreemPayload;
  if (isObject(event.data)) return event.data as CreemPayload;
  return event;
}

function getProductId(event: CreemPayload, sub?: CreemPayload) {
  const object = event.object;
  return asString(sub?.product_id)
    || (typeof sub?.product === "string" ? sub.product : asString(sub?.product?.id))
    || (typeof object?.product === "string" ? object.product : asString(object?.product?.id))
    || asString(object?.order?.product)
    || asString(object?.subscription?.product_id)
    || (typeof object?.subscription?.product === "string" ? object.subscription.product : asString(object?.subscription?.product?.id))
    || asString(event.product_id)
    || (typeof event.product === "string" ? event.product : asString(event.product?.id))
    || asString(event.data?.product_id)
    || (typeof event.data?.product === "string" ? event.data.product : asString(event.data?.product?.id));
}

function isActivationEvent(eventType: string, status?: string) {
  return [
    "checkout.completed",
    "subscription.created",
    "subscription.active",
    "subscription.paid",
    "subscription.updated",
  ].includes(eventType) || ["active", "trialing", "paid"].includes(status || "");
}

function isCancellationEvent(eventType: string, status?: string) {
  return [
    "subscription.cancelled",
    "subscription.canceled",
    "subscription.expired",
  ].includes(eventType) || ["cancelled", "canceled", "expired"].includes(status || "");
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("creem-signature")
    || req.headers.get("x-creem-signature")
    || req.headers.get("webhook-signature");

  if (!verifyCreemSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let event: CreemPayload;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventType = event.eventType || event.type || event.event;

  try {
    const sub = getSubscriptionPayload(event);
    const subscriptionId = asString(sub?.id) || asString(event.subscription_id) || asString(event.id);
    const status = asString(sub?.status) || asString(event.status) || "active";

    if (isActivationEvent(eventType || "", status)) {
      const userId = await resolveUserId(event, sub);
      const productId = getProductId(event, sub);
      const periodStart = asString(sub?.current_period_start) || asString(sub?.current_period_start_date);
      const periodEnd = asString(sub?.current_period_end) || asString(sub?.current_period_end_date);

      if (!userId || !subscriptionId) {
        return NextResponse.json(
          { error: "Missing user/subscription id" },
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
            currentPeriodStart: periodStart
              ? new Date(periodStart)
              : undefined,
            currentPeriodEnd: periodEnd
              ? new Date(periodEnd)
              : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existing.id));
      } else {
        await db.insert(subscriptions).values({
          userId,
          planId: planRow?.id ?? null,
          creemSubscriptionId: subscriptionId,
          creemCustomerId: getCreemCustomerId(event, sub),
          status,
          currentPeriodStart: periodStart
            ? new Date(periodStart)
            : new Date(),
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }

      await db.insert(analyticsEvents).values({
        eventName: "checkout_completed",
        userId,
        plan: "pro",
        metadata: {
          subscriptionId,
          productId: productId || null,
          status,
        },
      }).catch(() => {});
    }

    if (isCancellationEvent(eventType || "", status)) {
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
