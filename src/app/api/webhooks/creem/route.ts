import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { analyticsEvents, subscriptions, plans, users, reportPurchases, teamMembers, teamWorkspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getConfiguredProductId, getPlanFromName, isCheckoutType, type CheckoutType } from "@/lib/plans";
import { handleRejectionReviewCreemEvent } from "@/lib/rejection-review/payment";
import { verifyCreemWebhookSignature } from "@/lib/rejection-review/webhook-policy";

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

function getMetadataUserId(event: CreemPayload, sub?: CreemPayload) {
  const object = event.object;
  return asString(event.metadata?.userId)
    || asString(event.data?.metadata?.userId)
    || asString(object?.metadata?.userId)
    || asString(event.subscription?.metadata?.userId)
    || asString(sub?.metadata?.userId);
}

function getMetadataValue(event: CreemPayload, key: string) {
  const object = event.object;
  return asString(event.metadata?.[key])
    || asString(event.data?.metadata?.[key])
    || asString(object?.metadata?.[key])
    || asString(event.subscription?.metadata?.[key]);
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

function getCheckoutTypeFromProduct(productId?: string): CheckoutType | null {
  if (!productId) return null;
  if (productId === getConfiguredProductId("team_monthly")) return "team_monthly";
  if (productId === getConfiguredProductId("single_report_export")) return "single_report_export";
  if (productId === getConfiguredProductId("pro_monthly")) return "pro_monthly";
  return null;
}

async function ensurePlan(productId: string, checkoutType: CheckoutType) {
  const existing = (await db.select().from(plans).where(eq(plans.creemProductId, productId)).limit(1))[0];
  if (existing) return existing;

  const isTeam = checkoutType === "team_monthly";
  const [created] = await db
    .insert(plans)
    .values({
      creemProductId: productId,
      name: isTeam ? "Team" : "Pro",
      description: isTeam ? "Team plan with 5 seats" : "Pro monthly plan",
      priceMonthly: isTeam ? "99.00" : "19.00",
      reportsPerMonth: -1,
      maxTeamMembers: isTeam ? 5 : 1,
      features: isTeam
        ? ["unlimited_reports", "no_watermark", "word_export", "company_logo", "editable_share", "deep_search", "team_workspace"]
        : ["unlimited_reports", "no_watermark", "word_export", "company_logo", "editable_share", "deep_search"],
    })
    .returning();

  return created;
}

async function ensureTeamWorkspace(userId: string) {
  const existing = (await db
    .select()
    .from(teamWorkspaces)
    .where(eq(teamWorkspaces.ownerId, userId))
    .limit(1))[0];
  if (existing) return existing;

  const [team] = await db
    .insert(teamWorkspaces)
    .values({
      ownerId: userId,
      name: "8D Reports Team",
      maxSeats: 5,
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "owner",
  }).catch(() => {});

  return team;
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 256_000) {
    return NextResponse.json({ error: "Webhook body too large" }, { status: 413 });
  }
  const body = await req.text();
  if (Buffer.byteLength(body, "utf8") > 256_000) {
    return NextResponse.json({ error: "Webhook body too large" }, { status: 413 });
  }
  const signature = req.headers.get("creem-signature")
    || req.headers.get("x-creem-signature")
    || req.headers.get("webhook-signature");

  if (!verifyCreemWebhookSignature(body, signature)) {
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
    if (await handleRejectionReviewCreemEvent(event)) {
      return NextResponse.json({ received: true });
    }
    const sub = getSubscriptionPayload(event);
    const subscriptionId = asString(sub?.id) || asString(event.subscription_id) || asString(event.id);
    const status = asString(sub?.status) || asString(event.status) || "active";
    const productId = getProductId(event, sub);
    const metadataCheckoutType = getMetadataValue(event, "checkoutType");
    const checkoutType = isCheckoutType(metadataCheckoutType)
      ? metadataCheckoutType
      : getCheckoutTypeFromProduct(productId);

    if (isActivationEvent(eventType || "", status)) {
      const userId = await resolveUserId(event, sub);
      const periodStart = asString(sub?.current_period_start) || asString(sub?.current_period_start_date);
      const periodEnd = asString(sub?.current_period_end) || asString(sub?.current_period_end_date);

      if (!userId) {
        return NextResponse.json(
          { error: "Missing user id" },
          { status: 400 }
        );
      }

      if (checkoutType === "single_report_export") {
        const reportId = getMetadataValue(event, "reportId");
        const checkoutId = asString(event.id) || subscriptionId || randomUUID();
        if (!reportId) {
          return NextResponse.json({ error: "Missing report id" }, { status: 400 });
        }

        await db.insert(reportPurchases).values({
          userId,
          reportId,
          creemCheckoutId: checkoutId,
          creemProductId: productId || null,
          status: "active",
          purchaseType: "single_report_export",
        }).catch(async () => {
          await db
            .update(reportPurchases)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(reportPurchases.creemCheckoutId, checkoutId));
        });

        await db.insert(analyticsEvents).values({
          eventName: "checkout_completed",
          userId,
          reportId,
          plan: "single_report_export",
          metadata: { checkoutId, productId: productId || null, status },
        }).catch(() => {});

        return NextResponse.json({ received: true });
      }

      if (!subscriptionId) {
        return NextResponse.json({ error: "Missing subscription id" }, { status: 400 });
      }

      const planRow = productId && checkoutType
        ? await ensurePlan(productId, checkoutType)
        : productId
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
        plan: getPlanFromName(planRow?.name),
        metadata: {
          subscriptionId,
          productId: productId || null,
          status,
        },
      }).catch(() => {});

      if (getPlanFromName(planRow?.name) === "team") {
        await ensureTeamWorkspace(userId);
      }
    }

    if (isCancellationEvent(eventType || "", status)) {
      if (subscriptionId) {
        await db
          .update(subscriptions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(subscriptions.creemSubscriptionId, subscriptionId));
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
