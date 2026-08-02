import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  rejectionReviewEntitlements,
  rejectionReviewOrders,
  rejectionReviewRevocations,
  rejectionReviewTasks,
} from "@/lib/db/schema";
import {
  createRejectionReviewCreemCheckout,
  getRejectionReviewCreemConfig,
  retrieveRejectionReviewCreemCheckout,
  RejectionReviewProviderError,
} from "@/lib/rejection-review/creem-payment";
import { classifyReviewActor } from "@/lib/rejection-review/event-policy";
import { recordRejectionReviewEvent } from "@/lib/rejection-review/funnel";
import {
  processRejectionReviewPaymentEvent,
  type RejectionReviewPaymentFlowStore,
  type RejectionReviewPaymentOrder,
} from "@/lib/rejection-review/payment-flow";
import {
  buildRejectionReviewSuccessUrl,
  getRejectionReviewDeliveryStatus,
  hasRejectionReviewPaidAccess,
  REJECTION_REVIEW_CURRENCY,
  REJECTION_REVIEW_PRICE_CENTS,
  REJECTION_REVIEW_PRICE_VARIANT,
  type RejectionReviewCheckoutCompleted,
  type RejectionReviewRevocation,
} from "@/lib/rejection-review/payment-policy";
import {
  parseConciergeReviewDeliverable,
  type ConciergeReviewDeliverable,
} from "@/lib/rejection-review/schema";
import { getRejectionReviewTaskByToken } from "@/lib/rejection-review/service";

const ACTIVE_ORDER_STATUSES = ["pending", "processing", "paid"] as const;

type SessionUser = { id: string; email: string };

export class RejectionReviewPaymentError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "RejectionReviewPaymentError";
    this.code = code;
    this.status = status;
  }
}

const paymentOrderSelection = {
  id: rejectionReviewOrders.id,
  taskId: rejectionReviewOrders.taskId,
  userId: rejectionReviewOrders.userId,
  priceVariant: rejectionReviewOrders.priceVariant,
  providerRequestId: rejectionReviewOrders.providerRequestId,
  providerCheckoutId: rejectionReviewOrders.providerCheckoutId,
  providerOrderId: rejectionReviewOrders.providerOrderId,
  providerTransactionId: rejectionReviewOrders.providerTransactionId,
  providerProductId: rejectionReviewOrders.providerProductId,
  providerMode: rejectionReviewOrders.providerMode,
  expectedAmountCents: rejectionReviewOrders.expectedAmountCents,
  refundedAmountCents: rejectionReviewOrders.refundedAmountCents,
  currency: rejectionReviewOrders.currency,
  status: rejectionReviewOrders.status,
  customerKind: rejectionReviewOrders.customerKind,
} as const;

async function findPaymentOrderById(orderId: string): Promise<RejectionReviewPaymentOrder | null> {
  const [order] = await db.select(paymentOrderSelection)
    .from(rejectionReviewOrders)
    .where(eq(rejectionReviewOrders.id, orderId))
    .limit(1);
  return order as RejectionReviewPaymentOrder | undefined || null;
}

async function findPaymentOrderByTransactionId(transactionId: string): Promise<RejectionReviewPaymentOrder | null> {
  const [order] = await db.select(paymentOrderSelection)
    .from(rejectionReviewOrders)
    .where(eq(rejectionReviewOrders.providerTransactionId, transactionId))
    .limit(1);
  return order as RejectionReviewPaymentOrder | undefined || null;
}

async function findPaymentOrderByProviderOrderId(orderId: string): Promise<RejectionReviewPaymentOrder | null> {
  const [order] = await db.select(paymentOrderSelection)
    .from(rejectionReviewOrders)
    .where(eq(rejectionReviewOrders.providerOrderId, orderId))
    .limit(1);
  return order as RejectionReviewPaymentOrder | undefined || null;
}

async function findPaymentOrderByProviderRequestId(requestId: string): Promise<RejectionReviewPaymentOrder | null> {
  const [order] = await db.select(paymentOrderSelection)
    .from(rejectionReviewOrders)
    .where(eq(rejectionReviewOrders.providerRequestId, requestId))
    .limit(1);
  return order as RejectionReviewPaymentOrder | undefined || null;
}

function revocationFromRow(row: typeof rejectionReviewRevocations.$inferSelect): RejectionReviewRevocation {
  return {
    kind: row.kind as "refund" | "dispute",
    eventId: row.providerEventId,
    providerObjectId: row.providerObjectId,
    transactionId: row.providerTransactionId,
    providerOrderId: row.providerOrderId,
    providerRequestId: row.providerRequestId,
    providerProductId: row.providerProductId,
    providerMode: null,
    markedAsRejectionReview: true,
    amountCents: row.amountCents,
    currency: row.currency,
    reason: row.reason,
  };
}

async function taskEventContext(taskId: string) {
  const [task] = await db.select({
    anonymousSessionHash: rejectionReviewTasks.anonymousSessionHash,
    trafficSource: rejectionReviewTasks.trafficSource,
  }).from(rejectionReviewTasks).where(eq(rejectionReviewTasks.id, taskId)).limit(1);
  return task || null;
}

const paymentFlowStore: RejectionReviewPaymentFlowStore = {
  findOrderById: findPaymentOrderById,
  findOrderByTransactionId: findPaymentOrderByTransactionId,
  findOrderByProviderOrderId: findPaymentOrderByProviderOrderId,
  findOrderByProviderRequestId: findPaymentOrderByProviderRequestId,
  async recordRevocation(revocation) {
    await db.insert(rejectionReviewRevocations).values({
      providerEventId: revocation.eventId,
      kind: revocation.kind,
      providerObjectId: revocation.providerObjectId,
      providerTransactionId: revocation.transactionId,
      providerOrderId: revocation.providerOrderId,
      providerRequestId: revocation.providerRequestId,
      providerProductId: revocation.providerProductId,
      amountCents: revocation.amountCents,
      currency: revocation.currency,
      reason: revocation.reason,
    }).onConflictDoNothing();
  },
  async findPendingRevocation(input) {
    const [row] = await db.select().from(rejectionReviewRevocations).where(and(
      isNull(rejectionReviewRevocations.processedAt),
      or(
        eq(rejectionReviewRevocations.providerTransactionId, input.transactionId),
        eq(rejectionReviewRevocations.providerOrderId, input.providerOrderId),
        eq(rejectionReviewRevocations.providerRequestId, input.providerRequestId),
      ),
    )).orderBy(desc(rejectionReviewRevocations.createdAt)).limit(1);
    return row ? revocationFromRow(row) : null;
  },
  async markRevocationProcessed(eventId, orderId) {
    await db.update(rejectionReviewRevocations).set({
      matchedOrderId: orderId,
      processedAt: new Date(),
    }).where(eq(rejectionReviewRevocations.providerEventId, eventId));
  },
  async markInvalidCheckout(orderId, failureType) {
    await db.update(rejectionReviewOrders).set({
      status: "failed",
      failureType,
      revokedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(
      eq(rejectionReviewOrders.id, orderId),
      inArray(rejectionReviewOrders.status, ["pending", "processing"]),
    ));
  },
  async markPaid({ order, checkout, transactionId }) {
    const [updated] = await db.update(rejectionReviewOrders).set({
      providerCheckoutId: checkout.checkoutId,
      providerOrderId: checkout.orderId,
      providerTransactionId: transactionId,
      status: "paid",
      paidAmountCents: checkout.paidAmountCents,
      failureType: null,
      paidAt: new Date(),
      revokedAt: null,
      updatedAt: new Date(),
    }).where(and(
      eq(rejectionReviewOrders.id, order.id),
      inArray(rejectionReviewOrders.status, ["pending", "processing", "paid"]),
    )).returning({ id: rejectionReviewOrders.id });
    return Boolean(updated);
  },
  async activateEntitlement(order) {
    const grantedAt = new Date();
    await db.execute(sql`
      insert into ${rejectionReviewEntitlements} (
        task_id, order_id, user_id, status, granted_at, revoked_at, revoke_reason, updated_at
      )
      select
        ${order.taskId}::uuid,
        ${order.id}::uuid,
        ${order.userId},
        'active',
        ${grantedAt},
        null,
        null,
        ${grantedAt}
      from ${rejectionReviewOrders}
      where ${rejectionReviewOrders.id} = ${order.id}
        and ${rejectionReviewOrders.status} = 'paid'
        and ${rejectionReviewOrders.revokedAt} is null
      for update
      on conflict (task_id) do update set
        order_id = excluded.order_id,
        user_id = excluded.user_id,
        status = 'active',
        granted_at = excluded.granted_at,
        revoked_at = null,
        revoke_reason = null,
        updated_at = excluded.updated_at
    `);
  },
  async revoke({ order, revocation }) {
    const revokedAt = new Date();
    const status = revocation.kind === "refund" ? "refunded" : "disputed";
    const refundAmount = revocation.kind === "refund"
      ? Math.max(order.refundedAmountCents || 0, revocation.amountCents || 0)
      : order.refundedAmountCents || 0;
    await db.update(rejectionReviewOrders).set({
      status,
      refundedAmountCents: revocation.kind === "refund"
        ? sql`greatest(${rejectionReviewOrders.refundedAmountCents}, ${refundAmount})`
        : order.refundedAmountCents || 0,
      failureType: revocation.kind === "refund" ? "provider_refund" : "provider_dispute",
      qualificationStatus: revocation.kind === "refund" ? "excluded_refund" : "excluded_dispute",
      qualificationReason: revocation.reason || revocation.kind,
      revokedAt,
      updatedAt: revokedAt,
    }).where(eq(rejectionReviewOrders.id, order.id));
    await db.update(rejectionReviewEntitlements).set({
      status: "revoked",
      revokedAt,
      revokeReason: revocation.kind,
      updatedAt: revokedAt,
    }).where(eq(rejectionReviewEntitlements.orderId, order.id));
  },
  async recordPurchaseCompleted({ order }) {
    const task = await taskEventContext(order.taskId);
    if (!task) return;
    await recordRejectionReviewEvent({
      eventName: "review_purchase_completed",
      anonymousSessionHash: task.anonymousSessionHash,
      actorKind: order.customerKind,
      trafficSource: task.trafficSource,
      userId: order.userId,
      taskId: order.taskId,
      orderId: order.id,
      metadata: { priceVariant: order.priceVariant },
      dedupeKey: `review_purchase_completed:${order.id}`,
    });
    const [previousPurchase] = await db.select({ id: rejectionReviewOrders.id })
      .from(rejectionReviewOrders)
      .where(and(
        eq(rejectionReviewOrders.userId, order.userId),
        eq(rejectionReviewOrders.status, "paid"),
        ne(rejectionReviewOrders.taskId, order.taskId),
      ))
      .limit(1);
    if (previousPurchase) {
      await recordRejectionReviewEvent({
        eventName: "review_repeat_purchase",
        anonymousSessionHash: task.anonymousSessionHash,
        actorKind: order.customerKind,
        trafficSource: task.trafficSource,
        userId: order.userId,
        taskId: order.taskId,
        orderId: order.id,
        metadata: { priceVariant: order.priceVariant },
        dedupeKey: `review_repeat_purchase:${order.id}`,
      });
    }
  },
};

async function resolveCheckoutTransactionId(checkout: RejectionReviewCheckoutCompleted) {
  const config = getRejectionReviewCreemConfig();
  if (config.mode !== checkout.mode || config.productId !== checkout.productId) return null;
  const verified = await retrieveRejectionReviewCreemCheckout({ config, checkoutId: checkout.checkoutId });
  if (
    verified.status !== "completed"
    || verified.requestId !== checkout.requestId
    || verified.productId !== checkout.productId
    || verified.orderId !== checkout.orderId
  ) return null;
  return verified.transactionId;
}

export async function handleRejectionReviewCreemEvent(event: unknown) {
  let config: ReturnType<typeof getRejectionReviewCreemConfig> | null = null;
  try {
    config = getRejectionReviewCreemConfig();
  } catch {
    // Legacy payment webhooks must keep working when the Concierge SKU is not configured.
  }
  return processRejectionReviewPaymentEvent(event, {
    store: paymentFlowStore,
    resolveTransactionId: resolveCheckoutTransactionId,
    isRejectionReviewProduct: (revocation) => Boolean(
      config
      && revocation.providerProductId === config.productId
      && (!revocation.providerMode || revocation.providerMode === config.mode)
    ),
  });
}

async function claimReviewTaskForUser(token: string, userId: string) {
  const task = await getRejectionReviewTaskByToken(token);
  if (!task) throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
  if (task.userId && task.userId !== userId) {
    throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
  }
  if (!task.userId) {
    const [claimed] = await db.update(rejectionReviewTasks).set({
      userId,
      updatedAt: new Date(),
    }).where(and(
      eq(rejectionReviewTasks.id, task.id),
      isNull(rejectionReviewTasks.userId),
    )).returning({ id: rejectionReviewTasks.id });
    if (!claimed) {
      const [owner] = await db.select({ userId: rejectionReviewTasks.userId })
        .from(rejectionReviewTasks)
        .where(eq(rejectionReviewTasks.id, task.id))
        .limit(1);
      if (owner?.userId !== userId) {
        throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
      }
    }
  }
  if (task.status === "analysis_failed") {
    throw new RejectionReviewPaymentError("review_analysis_failed", "This review is not available for checkout", 409);
  }
  return { ...task, userId };
}

async function findActiveTaskOrder(taskId: string) {
  const [order] = await db.select()
    .from(rejectionReviewOrders)
    .where(and(
      eq(rejectionReviewOrders.taskId, taskId),
      inArray(rejectionReviewOrders.status, [...ACTIVE_ORDER_STATUSES]),
    ))
    .orderBy(desc(rejectionReviewOrders.createdAt))
    .limit(1);
  return order || null;
}

export async function startRejectionReviewCheckout(input: { token: string; user: SessionUser }) {
  const task = await claimReviewTaskForUser(input.token, input.user.id);
  const config = getRejectionReviewCreemConfig();
  let order = await findActiveTaskOrder(task.id);
  if (order && order.userId !== input.user.id) {
    throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
  }

  if (!order) {
    const orderId = randomUUID();
    const [created] = await db.insert(rejectionReviewOrders).values({
      id: orderId,
      taskId: task.id,
      userId: input.user.id,
      priceVariant: REJECTION_REVIEW_PRICE_VARIANT,
      providerRequestId: `reject-review:${orderId}`,
      providerProductId: config.productId,
      providerMode: config.mode,
      status: "pending",
      customerKind: classifyReviewActor({ email: input.user.email, providerMode: config.mode }),
      expectedAmountCents: REJECTION_REVIEW_PRICE_CENTS,
      paidAmountCents: 0,
      refundedAmountCents: 0,
      currency: REJECTION_REVIEW_CURRENCY,
      qualificationStatus: "unverified",
      deliverableReadyAt: null,
    }).onConflictDoNothing().returning();
    order = created || await findActiveTaskOrder(task.id);
  }
  if (!order) throw new RejectionReviewPaymentError("order_creation_failed", "Checkout could not be prepared", 503);
  const successUrl = buildRejectionReviewSuccessUrl(order.id);
  if (
    order.priceVariant !== REJECTION_REVIEW_PRICE_VARIANT
    || order.expectedAmountCents !== REJECTION_REVIEW_PRICE_CENTS
    || order.currency !== REJECTION_REVIEW_CURRENCY
    || order.providerMode !== config.mode
    || order.providerProductId !== config.productId
  ) {
    throw new RejectionReviewPaymentError("checkout_configuration_changed", "Checkout configuration changed. Please try again later.", 409);
  }
  if (order.status === "paid") {
    return {
      orderId: order.id,
      status: "paid" as const,
      checkoutUrl: null,
      priceVariant: order.priceVariant,
      priceCents: order.expectedAmountCents,
      currency: order.currency,
    };
  }
  if (order.checkoutUrl) {
    return {
      orderId: order.id,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      priceVariant: order.priceVariant,
      priceCents: order.expectedAmountCents,
      currency: order.currency,
    };
  }
  try {
    const checkout = await createRejectionReviewCreemCheckout({
      config,
      requestId: order.providerRequestId,
      reviewTaskId: task.id,
      reviewOrderId: order.id,
      userId: input.user.id,
      customerEmail: input.user.email,
      successUrl,
      priceCents: order.expectedAmountCents,
    });
    await db.update(rejectionReviewOrders).set({
      providerCheckoutId: checkout.checkoutId,
      providerOrderId: checkout.orderId,
      providerTransactionId: checkout.transactionId,
      checkoutUrl: checkout.checkoutUrl,
      failureType: null,
      updatedAt: new Date(),
    }).where(and(
      eq(rejectionReviewOrders.id, order.id),
      inArray(rejectionReviewOrders.status, ["pending", "processing"]),
    ));
    await recordRejectionReviewEvent({
      eventName: "review_checkout_started",
      anonymousSessionHash: task.anonymousSessionHash,
      actorKind: order.customerKind as "unknown" | "owner" | "test" | "external",
      trafficSource: task.trafficSource,
      userId: input.user.id,
      taskId: task.id,
      orderId: order.id,
      metadata: { priceVariant: order.priceVariant },
      dedupeKey: `review_checkout_started:${order.id}`,
    });
    return {
      orderId: order.id,
      status: "pending" as const,
      checkoutUrl: checkout.checkoutUrl,
      priceVariant: order.priceVariant,
      priceCents: order.expectedAmountCents,
      currency: order.currency,
    };
  } catch (error) {
    const failureType = error instanceof RejectionReviewProviderError ? error.code : "checkout_failed";
    await db.update(rejectionReviewOrders).set({ failureType, updatedAt: new Date() })
      .where(eq(rejectionReviewOrders.id, order.id));
    throw error;
  }
}

export async function validateRejectionReviewReturn(input: {
  token: string;
  userId: string;
  orderId?: string | null;
}) {
  const task = await getRejectionReviewTaskByToken(input.token);
  if (!task || (task.userId && task.userId !== input.userId)) return false;
  if (!input.orderId) return true;
  const [order] = await db.select({ id: rejectionReviewOrders.id })
    .from(rejectionReviewOrders)
    .where(and(
      eq(rejectionReviewOrders.id, input.orderId),
      eq(rejectionReviewOrders.taskId, task.id),
      eq(rejectionReviewOrders.userId, input.userId),
    ))
    .limit(1);
  return Boolean(order);
}

async function purchaseRowsForTask(taskId: string, userId: string) {
  return db.select({
    order: rejectionReviewOrders,
    entitlement: rejectionReviewEntitlements,
  }).from(rejectionReviewOrders)
    .leftJoin(rejectionReviewEntitlements, eq(rejectionReviewEntitlements.orderId, rejectionReviewOrders.id))
    .where(and(
      eq(rejectionReviewOrders.taskId, taskId),
      eq(rejectionReviewOrders.userId, userId),
    ))
    .orderBy(desc(rejectionReviewOrders.createdAt))
    .limit(1);
}

export async function getRejectionReviewPurchaseState(input: { token: string; userId: string }) {
  const task = await getRejectionReviewTaskByToken(input.token);
  if (!task || task.userId !== input.userId) {
    throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
  }
  const [row] = await purchaseRowsForTask(task.id, input.userId);
  if (!row) return { status: "not_started" as const, hasFullAccess: false };
  return {
    orderId: row.order.id,
    status: row.order.status,
    hasFullAccess: hasRejectionReviewPaidAccess({
      orderStatus: row.order.status,
      entitlementStatus: row.entitlement?.status,
      deliverableReadyAt: row.order.deliverableReadyAt,
      orderRevokedAt: row.order.revokedAt,
      entitlementRevokedAt: row.entitlement?.revokedAt,
    }),
    priceCents: row.order.expectedAmountCents,
    priceVariant: row.order.priceVariant,
    currency: row.order.currency,
    deliveryStatus: getRejectionReviewDeliveryStatus({
      orderStatus: row.order.status,
      deliverableReadyAt: row.order.deliverableReadyAt,
    }),
    checkoutUrl: ["pending", "processing"].includes(row.order.status) ? row.order.checkoutUrl : null,
  };
}

export async function getPaidRejectionReviewResult(input: { token: string; userId: string }) {
  const task = await getRejectionReviewTaskByToken(input.token);
  if (!task || task.userId !== input.userId) {
    throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
  }
  const [row] = await purchaseRowsForTask(task.id, input.userId);
  const hasAccess = row && hasRejectionReviewPaidAccess({
    orderStatus: row.order.status,
    entitlementStatus: row.entitlement?.status,
    deliverableReadyAt: row.order.deliverableReadyAt,
    orderRevokedAt: row.order.revokedAt,
    entitlementRevokedAt: row.entitlement?.revokedAt,
  });
  if (
    row?.order.status === "paid"
    && row.entitlement?.status === "active"
    && !row.order.revokedAt
    && !row.entitlement.revokedAt
    && !row.order.deliverableReadyAt
  ) {
    throw new RejectionReviewPaymentError("deep_review_in_progress", "Your 24-hour Deep Review is in progress", 409);
  }
  if (!row || !hasAccess) {
    throw new RejectionReviewPaymentError("full_review_locked", "Complete review access requires a completed purchase", 403);
  }
  const deliverable = parseConciergeReviewDeliverable(task.deliveryResultJson);
  if (!deliverable) {
    throw new RejectionReviewPaymentError(
      "deliverable_unavailable",
      "The delivered review package is temporarily unavailable",
      503,
    );
  }
  const viewedAt = row.order.fullResultViewedAt || new Date();
  if (!row.order.fullResultViewedAt) {
    await db.update(rejectionReviewOrders).set({ fullResultViewedAt: viewedAt, updatedAt: viewedAt })
      .where(and(eq(rejectionReviewOrders.id, row.order.id), isNull(rejectionReviewOrders.fullResultViewedAt)));
  }
  await recordRejectionReviewEvent({
    eventName: "review_full_result_viewed",
    anonymousSessionHash: task.anonymousSessionHash,
    actorKind: row.order.customerKind as "unknown" | "owner" | "test" | "external",
    trafficSource: task.trafficSource,
    userId: input.userId,
    taskId: task.id,
    orderId: row.order.id,
    metadata: { resultStatus: task.status },
    dedupeKey: `review_full_result_viewed:${row.order.id}`,
  });
  return { taskId: task.id, orderId: row.order.id, result: deliverable };
}

export async function recordRejectionReviewExport(input: { orderId: string; userId: string }) {
  const exportedAt = new Date();
  await db.update(rejectionReviewOrders).set({ exportedAt, updatedAt: exportedAt }).where(and(
    eq(rejectionReviewOrders.id, input.orderId),
    eq(rejectionReviewOrders.userId, input.userId),
    eq(rejectionReviewOrders.status, "paid"),
    isNull(rejectionReviewOrders.revokedAt),
  ));
}

export async function recordRejectionReviewRefundRequest(input: { token: string; userId: string }) {
  const task = await getRejectionReviewTaskByToken(input.token);
  if (!task || task.userId !== input.userId) {
    throw new RejectionReviewPaymentError("review_not_found", "Review not found", 404);
  }
  const [row] = await purchaseRowsForTask(task.id, input.userId);
  if (!row || row.order.status !== "paid") {
    throw new RejectionReviewPaymentError("purchase_not_refundable", "No completed purchase is available for a refund request", 409);
  }
  await recordRejectionReviewEvent({
    eventName: "review_refund_requested",
    anonymousSessionHash: task.anonymousSessionHash,
    actorKind: row.order.customerKind as "unknown" | "owner" | "test" | "external",
    trafficSource: task.trafficSource,
    userId: input.userId,
    taskId: task.id,
    orderId: row.order.id,
    dedupeKey: `review_refund_requested:${row.order.id}`,
  });
  return { accepted: true, orderId: row.order.id };
}

export async function deliverPaidRejectionReview(input: {
  orderId: string;
  deliverable: unknown;
}) {
  const deliverable = parseConciergeReviewDeliverable(input.deliverable);
  if (!deliverable) {
    throw new RejectionReviewPaymentError(
      "deliverable_invalid",
      "The delivery package failed its evidence-safety schema",
      400,
    );
  }
  const deliveredAt = new Date();
  const deliveryJson = JSON.stringify(deliverable satisfies ConciergeReviewDeliverable);
  const result = await db.execute(sql`
    with eligible as (
      select
        ${rejectionReviewOrders.id} as order_id,
        ${rejectionReviewOrders.taskId} as task_id,
        ${rejectionReviewOrders.userId} as user_id,
        ${rejectionReviewOrders.customerKind} as customer_kind,
        ${rejectionReviewOrders.paidAt} as paid_at,
        ${rejectionReviewTasks.anonymousSessionHash} as anonymous_session_hash,
        ${rejectionReviewTasks.trafficSource} as traffic_source
      from ${rejectionReviewOrders}
      join ${rejectionReviewEntitlements}
        on ${rejectionReviewEntitlements.orderId} = ${rejectionReviewOrders.id}
      join ${rejectionReviewTasks}
        on ${rejectionReviewTasks.id} = ${rejectionReviewOrders.taskId}
      where ${rejectionReviewOrders.id} = ${input.orderId}::uuid
        and ${rejectionReviewOrders.status} = 'paid'
        and ${rejectionReviewOrders.revokedAt} is null
        and ${rejectionReviewOrders.deliverableReadyAt} is null
        and ${rejectionReviewEntitlements.status} = 'active'
        and ${rejectionReviewEntitlements.revokedAt} is null
      for update of ${rejectionReviewOrders}
    ), updated_task as (
      update ${rejectionReviewTasks}
      set
        ${rejectionReviewTasks.deliveryResultJson} = ${deliveryJson}::jsonb,
        ${rejectionReviewTasks.status} = 'full_ready',
        ${rejectionReviewTasks.updatedAt} = ${deliveredAt}
      from eligible
      where ${rejectionReviewTasks.id} = eligible.task_id
      returning ${rejectionReviewTasks.id} as task_id
    ), updated_order as (
      update ${rejectionReviewOrders}
      set
        ${rejectionReviewOrders.deliverableReadyAt} = ${deliveredAt},
        ${rejectionReviewOrders.failureType} = null,
        ${rejectionReviewOrders.updatedAt} = ${deliveredAt}
      from eligible, updated_task
      where ${rejectionReviewOrders.id} = eligible.order_id
      returning ${rejectionReviewOrders.id} as order_id
    ), inserted_event as (
      insert into ${sql.identifier("rejection_review_funnel_events")} (
        event_name,
        anonymous_session_hash,
        actor_kind,
        traffic_source,
        user_id,
        task_id,
        order_id,
        duration_ms,
        metadata,
        dedupe_key,
        created_at
      )
      select
        'review_delivered',
        eligible.anonymous_session_hash,
        eligible.customer_kind,
        eligible.traffic_source,
        eligible.user_id,
        eligible.task_id,
        eligible.order_id,
        case
          when eligible.paid_at is null then null
          else greatest(0, floor(extract(epoch from (${deliveredAt}::timestamp - eligible.paid_at)) * 1000))::integer
        end,
        '{"priceVariant":"deep_review"}'::jsonb,
        'review_delivered:' || eligible.order_id::text,
        ${deliveredAt}
      from eligible
      join updated_order on updated_order.order_id = eligible.order_id
      on conflict (dedupe_key) do nothing
      returning id
    )
    select updated_order.order_id from updated_order
  `);
  const deliveredRows = (result as unknown as { rows?: Array<{ order_id: string }> }).rows || [];
  if (deliveredRows.length) {
    return { orderId: deliveredRows[0].order_id, deliveredAt, alreadyDelivered: false as const };
  }

  const [existing] = await db.select({
    status: rejectionReviewOrders.status,
    revokedAt: rejectionReviewOrders.revokedAt,
    deliverableReadyAt: rejectionReviewOrders.deliverableReadyAt,
  }).from(rejectionReviewOrders).where(eq(rejectionReviewOrders.id, input.orderId)).limit(1);
  if (existing?.status === "paid" && !existing.revokedAt && existing.deliverableReadyAt) {
    return {
      orderId: input.orderId,
      deliveredAt: existing.deliverableReadyAt,
      alreadyDelivered: true as const,
    };
  }
  throw new RejectionReviewPaymentError(
    "purchase_not_deliverable",
    "Only a paid, active, non-refunded review can be delivered",
    409,
  );
}
