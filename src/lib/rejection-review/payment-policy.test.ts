import assert from "node:assert/strict";
import {
  buildRejectionReviewSuccessUrl,
  getRejectionReviewApiBase,
  getRejectionReviewDeliveryStatus,
  getRejectionReviewProviderMode,
  hasRejectionReviewPaidAccess,
  isMarkedRejectionReviewCheckoutEvent,
  parseRejectionReviewCheckoutCompleted,
  parseRejectionReviewRevocation,
  validateRejectionReviewCheckout,
  REJECTION_REVIEW_PRICE_CENTS,
  REJECTION_REVIEW_PRICE_VARIANT,
} from "@/lib/rejection-review/payment-policy";

function checkoutCompleted(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_review_paid_1",
    eventType: "checkout.completed",
    object: {
      id: "ch_review_1",
      object: "checkout",
      request_id: "reject-review:order-1",
      status: "completed",
      mode: "test",
      order: {
        id: "ord_review_1",
        product: "prod_review_test",
        amount: 9900,
        currency: "USD",
        status: "paid",
        type: "one_time",
        transaction: "tran_review_1",
      },
      product: { id: "prod_review_test", billing_type: "one-time" },
      subscription: null,
      metadata: {
        checkoutType: "rejection_review_deep_review",
        priceVariant: "deep_review",
        reviewTaskId: "task-1",
        reviewOrderId: "order-1",
        userId: "user-1",
      },
      ...overrides,
    },
  };
}

assert.equal(REJECTION_REVIEW_PRICE_CENTS, 9900);
assert.equal(REJECTION_REVIEW_PRICE_VARIANT, "deep_review");
assert.equal(getRejectionReviewProviderMode({ VERCEL_ENV: "preview", REJECTION_REVIEW_PAYMENT_MODE: "production" }), "test");
assert.equal(getRejectionReviewProviderMode({ VERCEL_ENV: "production", REJECTION_REVIEW_PAYMENT_MODE: "test" }), "production");
assert.equal(getRejectionReviewApiBase("test"), "https://test-api.creem.io/v1");
assert.equal(getRejectionReviewApiBase("production"), "https://api.creem.io/v1");
assert.equal(
  buildRejectionReviewSuccessUrl("00000000-0000-4000-8000-000000000001", { VERCEL_ENV: "preview", VERCEL_URL: "reject-check-preview.vercel.app" }),
  "https://reject-check-preview.vercel.app/8d-report-review-service/purchase-complete?review_order=00000000-0000-4000-8000-000000000001",
);
assert.throws(
  () => buildRejectionReviewSuccessUrl("token", { VERCEL_ENV: "preview", VERCEL_URL: "http://preview.example.com" }),
  /HTTPS/,
);

const rawCheckout = checkoutCompleted();
assert.equal(isMarkedRejectionReviewCheckoutEvent(rawCheckout), true);
const parsedCheckout = parseRejectionReviewCheckoutCompleted(rawCheckout);
assert.ok(parsedCheckout);
assert.equal(parsedCheckout.checkoutId, "ch_review_1");
assert.equal(parsedCheckout.orderId, "ord_review_1");
assert.equal(parsedCheckout.transactionId, "tran_review_1");
assert.equal(parsedCheckout.priceAmountCents, 9900);
assert.equal(parsedCheckout.paidAmountCents, 9900);
assert.equal(parsedCheckout.mode, "test");
const taxedCheckoutEvent = checkoutCompleted();
(taxedCheckoutEvent.object.order as Record<string, unknown>).amount_paid = 10693;
assert.equal(parseRejectionReviewCheckoutCompleted(taxedCheckoutEvent)?.paidAmountCents, 10693);
assert.equal(parseRejectionReviewCheckoutCompleted(checkoutCompleted({ subscription: { id: "sub_wrong" } })), null);
assert.equal(parseRejectionReviewCheckoutCompleted(checkoutCompleted({ status: "pending" })), null);
assert.equal(parseRejectionReviewCheckoutCompleted(checkoutCompleted({
  metadata: {
    checkoutType: "rejection_review_deep_review",
    reviewTaskId: "task-1",
    reviewOrderId: "order-1",
    userId: "user-1",
  },
})), null);
assert.equal(isMarkedRejectionReviewCheckoutEvent({ eventType: "checkout.completed", object: { request_id: "legacy" } }), false);

const storedOrder = {
  id: "order-1",
  taskId: "task-1",
  userId: "user-1",
  priceVariant: "deep_review",
  providerRequestId: "reject-review:order-1",
  providerCheckoutId: "ch_review_1",
  providerOrderId: "ord_review_1",
  providerTransactionId: "tran_review_1",
  providerProductId: "prod_review_test",
  providerMode: "test",
  expectedAmountCents: 9900,
  currency: "USD",
  status: "pending",
};
assert.deepEqual(validateRejectionReviewCheckout(parsedCheckout, storedOrder), { ok: true });
assert.deepEqual(validateRejectionReviewCheckout({
  ...parsedCheckout,
  metadata: { ...parsedCheckout.metadata, reviewTaskId: "task-wrong" },
}, storedOrder), { ok: false, failureType: "task_metadata_mismatch" });
assert.deepEqual(validateRejectionReviewCheckout({
  ...parsedCheckout,
  metadata: { ...parsedCheckout.metadata, userId: "user-wrong" },
}, storedOrder), { ok: false, failureType: "user_metadata_mismatch" });
assert.deepEqual(validateRejectionReviewCheckout({ ...parsedCheckout, requestId: "reject-review:wrong" }, storedOrder), {
  ok: false,
  failureType: "request_id_mismatch",
});
assert.deepEqual(validateRejectionReviewCheckout({ ...parsedCheckout, productId: "prod_wrong" }, storedOrder), {
  ok: false,
  failureType: "product_mismatch",
});
assert.deepEqual(validateRejectionReviewCheckout({ ...parsedCheckout, mode: "production" }, storedOrder), {
  ok: false,
  failureType: "provider_mode_mismatch",
});
assert.deepEqual(validateRejectionReviewCheckout({ ...parsedCheckout, priceAmountCents: 3900 }, storedOrder), {
  ok: false,
  failureType: "amount_mismatch",
});
assert.deepEqual(validateRejectionReviewCheckout({ ...parsedCheckout, paidAmountCents: 9800 }, storedOrder), {
  ok: false,
  failureType: "underpaid",
});
assert.deepEqual(validateRejectionReviewCheckout({ ...parsedCheckout, paidAmountCents: 10693 }, storedOrder), { ok: true });
assert.deepEqual(validateRejectionReviewCheckout(parsedCheckout, { ...storedOrder, priceVariant: "instant_scan" }), {
  ok: false,
  failureType: "price_variant_mismatch",
});
assert.deepEqual(validateRejectionReviewCheckout(parsedCheckout, { ...storedOrder, providerOrderId: "ord_wrong" }), {
  ok: false,
  failureType: "provider_order_id_mismatch",
});
assert.deepEqual(validateRejectionReviewCheckout(parsedCheckout, { ...storedOrder, status: "refunded" }), {
  ok: false,
  failureType: "terminal_order",
});

const refund = parseRejectionReviewRevocation({
  id: "evt_refund_1",
  eventType: "refund.created",
  object: {
    id: "ref_1",
    object: "refund",
    status: "succeeded",
    refund_amount: 9900,
    refund_currency: "USD",
    reason: "requested_by_customer",
    transaction: { id: "tran_review_1", status: "refunded", order: "ord_review_1" },
    order: { id: "ord_review_1", product: "prod_review_test", mode: "test" },
    checkout: {
      id: "ch_review_1",
      request_id: "reject-review:order-1",
      metadata: { checkoutType: "rejection_review_deep_review" },
      mode: "test",
    },
  },
});
assert.deepEqual(refund, {
  kind: "refund",
  eventId: "evt_refund_1",
  providerObjectId: "ref_1",
  transactionId: "tran_review_1",
  providerOrderId: "ord_review_1",
  providerRequestId: "reject-review:order-1",
  providerProductId: "prod_review_test",
  providerMode: "test",
  markedAsRejectionReview: true,
  amountCents: 9900,
  currency: "USD",
  reason: "requested_by_customer",
});
assert.equal(parseRejectionReviewRevocation({
  id: "evt_refund_cumulative",
  eventType: "refund.created",
  object: {
    id: "ref_2",
    status: "succeeded",
    refund_amount: 2000,
    refund_currency: "USD",
    transaction: { id: "tran_review_1", refunded_amount: 5000 },
  },
})?.amountCents, 5000);
assert.equal(parseRejectionReviewRevocation({
  id: "evt_refund_pending",
  eventType: "refund.created",
  object: { id: "ref_pending", status: "pending", transaction: { id: "tran_review_1" } },
}), null);
assert.equal(parseRejectionReviewRevocation({
  id: "evt_dispute_1",
  eventType: "dispute.created",
  object: { id: "disp_1", amount: 9900, currency: "USD", transaction: { id: "tran_review_1" } },
})?.kind, "dispute");

assert.equal(hasRejectionReviewPaidAccess({ orderStatus: "paid", entitlementStatus: "active" }), false);
assert.equal(hasRejectionReviewPaidAccess({
  orderStatus: "paid",
  entitlementStatus: "active",
  deliverableReadyAt: new Date(),
}), true);
for (const orderStatus of ["pending", "failed", "cancelled", "refunded", "disputed"]) {
  assert.equal(hasRejectionReviewPaidAccess({ orderStatus, entitlementStatus: "active", deliverableReadyAt: new Date() }), false);
}
assert.equal(hasRejectionReviewPaidAccess({ orderStatus: "paid", entitlementStatus: "revoked", deliverableReadyAt: new Date() }), false);
assert.equal(hasRejectionReviewPaidAccess({
  orderStatus: "paid",
  entitlementStatus: "active",
  deliverableReadyAt: new Date(),
  orderRevokedAt: new Date(),
}), false);
assert.equal(getRejectionReviewDeliveryStatus({ orderStatus: "pending" }), "not_started");
assert.equal(getRejectionReviewDeliveryStatus({ orderStatus: "paid" }), "in_progress");
assert.equal(getRejectionReviewDeliveryStatus({ orderStatus: "paid", deliverableReadyAt: new Date() }), "ready");
assert.equal(getRejectionReviewDeliveryStatus({ orderStatus: "refunded", deliverableReadyAt: new Date() }), "revoked");

console.log("8D Reject Check payment policy tests passed.");
