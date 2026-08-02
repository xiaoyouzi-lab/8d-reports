import assert from "node:assert/strict";
import {
  processRejectionReviewPaymentEvent,
  type RejectionReviewPaymentFlowStore,
  type RejectionReviewPaymentOrder,
} from "@/lib/rejection-review/payment-flow";
import { hasRejectionReviewPaidAccess } from "@/lib/rejection-review/payment-policy";
import type { RejectionReviewRevocation } from "@/lib/rejection-review/payment-policy";

function checkoutEvent(input: {
  amount?: number;
  paidAmount?: number;
  transaction?: string | null;
  priceVariant?: string;
} = {}) {
  return {
    id: "evt_paid_1",
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
        amount: input.amount ?? 9900,
        ...(input.paidAmount === undefined ? {} : { amount_paid: input.paidAmount }),
        currency: "USD",
        status: "paid",
        ...(input.transaction === null ? {} : { transaction: input.transaction || "tran_review_1" }),
      },
      product: "prod_review_test",
      subscription: null,
      metadata: {
        checkoutType: "rejection_review_deep_review",
        priceVariant: input.priceVariant ?? "deep_review",
        reviewTaskId: "task-1",
        reviewOrderId: "order-1",
        userId: "user-1",
      },
    },
  };
}

function baseOrder(): RejectionReviewPaymentOrder {
  return {
    id: "order-1",
    taskId: "task-1",
    userId: "user-1",
    priceVariant: "deep_review",
    providerRequestId: "reject-review:order-1",
    providerCheckoutId: null,
    providerOrderId: null,
    providerTransactionId: null,
    providerProductId: "prod_review_test",
    providerMode: "test",
    expectedAmountCents: 9900,
    refundedAmountCents: 0,
    currency: "USD",
    status: "pending",
    customerKind: "test",
  };
}

function createMemoryStore() {
  let order = baseOrder();
  let entitlement: "none" | "active" | "revoked" = "none";
  const purchaseEvents = new Set<string>();
  let activationWrites = 0;
  let capturedPaidAmount = 0;
  const revocations = new Map<string, RejectionReviewRevocation>();
  const store: RejectionReviewPaymentFlowStore = {
    async findOrderById(orderId) {
      return order.id === orderId ? structuredClone(order) : null;
    },
    async findOrderByTransactionId(transactionId) {
      return order.providerTransactionId === transactionId ? structuredClone(order) : null;
    },
    async findOrderByProviderOrderId(orderId) {
      return order.providerOrderId === orderId ? structuredClone(order) : null;
    },
    async findOrderByProviderRequestId(requestId) {
      return order.providerRequestId === requestId ? structuredClone(order) : null;
    },
    async recordRevocation(revocation) {
      if (!revocations.has(revocation.eventId)) revocations.set(revocation.eventId, structuredClone(revocation));
    },
    async findPendingRevocation(input) {
      for (const revocation of revocations.values()) {
        if (
          revocation.transactionId === input.transactionId
          || revocation.providerOrderId === input.providerOrderId
          || revocation.providerRequestId === input.providerRequestId
        ) return structuredClone(revocation);
      }
      return null;
    },
    async markRevocationProcessed(eventId) {
      revocations.delete(eventId);
    },
    async markInvalidCheckout(orderId, failureType) {
      if (order.id === orderId && ["pending", "processing"].includes(order.status)) {
        order = { ...order, status: "failed" };
        assert.ok(failureType);
      }
    },
    async markPaid({ checkout, transactionId }) {
      if (!["pending", "processing", "paid"].includes(order.status)) return false;
      order = {
        ...order,
        providerCheckoutId: checkout.checkoutId,
        providerOrderId: checkout.orderId,
        providerTransactionId: transactionId,
        status: "paid",
      };
      capturedPaidAmount = checkout.paidAmountCents;
      return true;
    },
    async activateEntitlement() {
      if (entitlement === "none") activationWrites += 1;
      entitlement = "active";
    },
    async revoke({ revocation }) {
      order = {
        ...order,
        status: revocation.kind === "refund" ? "refunded" : "disputed",
        refundedAmountCents: Math.max(order.refundedAmountCents, revocation.amountCents || 0),
      };
      entitlement = "revoked";
    },
    async recordPurchaseCompleted({ order: completedOrder }) {
      purchaseEvents.add(completedOrder.id);
    },
  };
  return {
    store,
    state: () => ({ order, entitlement, purchaseEvents: purchaseEvents.size, activationWrites, capturedPaidAmount }),
  };
}

async function main() {
const successful = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent(), { store: successful.store }), true);
assert.equal(successful.state().order.status, "paid");
assert.equal(successful.state().entitlement, "active");
assert.equal(successful.state().purchaseEvents, 1);
assert.equal(successful.state().capturedPaidAmount, 9900);
assert.equal(hasRejectionReviewPaidAccess({
  orderStatus: successful.state().order.status,
  entitlementStatus: successful.state().entitlement,
}), false, "payment alone must not unlock a concierge deliverable");
assert.equal(hasRejectionReviewPaidAccess({
  orderStatus: successful.state().order.status,
  entitlementStatus: successful.state().entitlement,
  deliverableReadyAt: new Date(),
}), true);

assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent(), { store: successful.store }), true);
assert.equal(successful.state().purchaseEvents, 1, "duplicate checkout webhook must not duplicate the purchase event");
assert.equal(successful.state().entitlement, "active", "duplicate checkout webhook must keep one active entitlement state");
assert.equal(successful.state().activationWrites, 1, "duplicate checkout webhook must keep one entitlement row");

const refundEvent = {
  id: "evt_refund_1",
  eventType: "refund.created",
  object: {
    id: "ref_1",
    status: "succeeded",
    refund_amount: 9900,
    refund_currency: "USD",
    transaction: { id: "tran_review_1", status: "refunded" },
    order: { id: "ord_review_1", product: "prod_review_test", mode: "test" },
    checkout: {
      id: "ch_review_1",
      request_id: "reject-review:order-1",
      metadata: { checkoutType: "rejection_review_deep_review" },
      mode: "test",
    },
  },
};
assert.equal(await processRejectionReviewPaymentEvent(refundEvent, { store: successful.store }), true);
assert.equal(successful.state().order.status, "refunded");
assert.equal(successful.state().entitlement, "revoked");
assert.equal(hasRejectionReviewPaidAccess({
  orderStatus: successful.state().order.status,
  entitlementStatus: successful.state().entitlement,
  deliverableReadyAt: new Date(),
}), false);
const writesBeforeReplay = successful.state().activationWrites;
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent(), { store: successful.store }), true);
assert.equal(successful.state().order.status, "refunded", "completed replay must not revive a refunded order");
assert.equal(successful.state().entitlement, "revoked", "completed replay must not revive revoked access");
assert.equal(successful.state().activationWrites, writesBeforeReplay);

const wrongAmount = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent({ amount: 3900 }), { store: wrongAmount.store }), true);
assert.equal(wrongAmount.state().order.status, "failed");
assert.equal(wrongAmount.state().entitlement, "none");

const wrongVariant = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent({ priceVariant: "instant_scan" }), { store: wrongVariant.store }), true);
assert.equal(wrongVariant.state().order.status, "failed");
assert.equal(wrongVariant.state().entitlement, "none");

const underpaid = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent({ paidAmount: 9800 }), { store: underpaid.store }), true);
assert.equal(underpaid.state().order.status, "failed");
assert.equal(underpaid.state().entitlement, "none");

const taxedPayment = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent({ paidAmount: 10693 }), { store: taxedPayment.store }), true);
assert.equal(taxedPayment.state().order.status, "paid");
assert.equal(taxedPayment.state().capturedPaidAmount, 10693, "actual charged amount should include provider tax");

const reconciled = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent({ transaction: null }), {
  store: reconciled.store,
  resolveTransactionId: async () => "tran_reconciled_1",
}), true);
assert.equal(reconciled.state().order.providerTransactionId, "tran_reconciled_1");
assert.equal(reconciled.state().entitlement, "active");

const disputed = createMemoryStore();
await processRejectionReviewPaymentEvent(checkoutEvent(), { store: disputed.store });
assert.equal(await processRejectionReviewPaymentEvent({
  id: "evt_dispute_1",
  eventType: "dispute.created",
  object: { id: "disp_1", amount: 9900, currency: "USD", transaction: { id: "tran_review_1" } },
}, { store: disputed.store }), true);
assert.equal(disputed.state().order.status, "disputed");
assert.equal(disputed.state().entitlement, "revoked");

const refundBeforeCheckout = createMemoryStore();
assert.equal(await processRejectionReviewPaymentEvent({
  id: "evt_refund_before_checkout",
  eventType: "refund.created",
  object: {
    id: "ref_before_checkout",
    status: "succeeded",
    refund_amount: 9900,
    refund_currency: "USD",
    transaction: { id: "tran_review_1", order: "ord_review_1" },
    order: { id: "ord_review_1", product: "prod_review_test", mode: "test" },
    checkout: {
      request_id: "reject-review:order-1",
      metadata: { checkoutType: "rejection_review_deep_review" },
      mode: "test",
    },
  },
}, { store: refundBeforeCheckout.store }), true);
assert.equal(refundBeforeCheckout.state().entitlement, "revoked", "known local order must be revoked immediately");

const pendingRefundStore = createMemoryStore();
const unmatchedRefund = {
  id: "evt_unmatched_refund_before_checkout",
  eventType: "refund.created",
  object: {
    id: "ref_unmatched_before_checkout",
    status: "succeeded",
    refund_amount: 9900,
    refund_currency: "USD",
    transaction: { id: "tran_future", order: "ord_future" },
    order: { id: "ord_future", product: "prod_review_test", mode: "test" },
    checkout: { mode: "test" },
  },
};
assert.equal(await processRejectionReviewPaymentEvent(unmatchedRefund, {
  store: pendingRefundStore.store,
  isRejectionReviewProduct: () => true,
}), true);
assert.equal(await processRejectionReviewPaymentEvent(checkoutEvent({ transaction: "tran_future" }), {
  store: pendingRefundStore.store,
}), true);
assert.equal(pendingRefundStore.state().order.status, "refunded");
assert.equal(pendingRefundStore.state().entitlement, "revoked");
assert.equal(pendingRefundStore.state().purchaseEvents, 0, "revoked payment must not record a completed purchase");

assert.equal(await processRejectionReviewPaymentEvent({
  id: "evt_legacy",
  eventType: "checkout.completed",
  object: { id: "ch_legacy", request_id: "legacy-checkout", metadata: { checkoutType: "pro_monthly" } },
}, { store: createMemoryStore().store }), false, "legacy checkout events must remain outside the rejection-review handler");

console.log("8D Reject Check payment flow integration tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
