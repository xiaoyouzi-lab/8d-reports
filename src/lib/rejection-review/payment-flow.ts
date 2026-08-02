import {
  isMarkedRejectionReviewCheckoutEvent,
  parseRejectionReviewCheckoutCompleted,
  parseRejectionReviewRevocation,
  validateRejectionReviewCheckout,
  type RejectionReviewCheckoutCompleted,
  type RejectionReviewOrderForValidation,
  type RejectionReviewRevocation,
} from "@/lib/rejection-review/payment-policy";

export type RejectionReviewPaymentOrder = RejectionReviewOrderForValidation & {
  customerKind: "unknown" | "owner" | "test" | "external";
  providerCheckoutId: string | null;
  providerTransactionId: string | null;
  refundedAmountCents: number;
};

export interface RejectionReviewPaymentFlowStore {
  findOrderById(orderId: string): Promise<RejectionReviewPaymentOrder | null>;
  findOrderByTransactionId(transactionId: string): Promise<RejectionReviewPaymentOrder | null>;
  findOrderByProviderOrderId(orderId: string): Promise<RejectionReviewPaymentOrder | null>;
  findOrderByProviderRequestId(requestId: string): Promise<RejectionReviewPaymentOrder | null>;
  recordRevocation(revocation: RejectionReviewRevocation): Promise<void>;
  findPendingRevocation(input: {
    transactionId: string;
    providerOrderId: string;
    providerRequestId: string;
  }): Promise<RejectionReviewRevocation | null>;
  markRevocationProcessed(eventId: string, orderId: string): Promise<void>;
  markInvalidCheckout(orderId: string, failureType: string): Promise<void>;
  markPaid(input: {
    order: RejectionReviewPaymentOrder;
    checkout: RejectionReviewCheckoutCompleted;
    transactionId: string;
  }): Promise<boolean>;
  activateEntitlement(order: RejectionReviewPaymentOrder): Promise<void>;
  revoke(input: { order: RejectionReviewPaymentOrder; revocation: RejectionReviewRevocation }): Promise<void>;
  recordPurchaseCompleted(input: {
    order: RejectionReviewPaymentOrder;
    checkout: RejectionReviewCheckoutCompleted;
  }): Promise<void>;
}

export type RejectionReviewPaymentFlowDependencies = {
  store: RejectionReviewPaymentFlowStore;
  resolveTransactionId?: (checkout: RejectionReviewCheckoutCompleted) => Promise<string | null>;
  isRejectionReviewProduct?: (revocation: RejectionReviewRevocation) => boolean;
};

export class RejectionReviewWebhookError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Rejection Review payment event could not be safely processed");
    this.name = "RejectionReviewWebhookError";
    this.code = code;
  }
}

export async function processRejectionReviewPaymentEvent(
  event: unknown,
  dependencies: RejectionReviewPaymentFlowDependencies,
) {
  if (isMarkedRejectionReviewCheckoutEvent(event)) {
    const checkout = parseRejectionReviewCheckoutCompleted(event);
    if (!checkout) throw new RejectionReviewWebhookError("malformed_checkout_completed");
    const order = await dependencies.store.findOrderById(checkout.metadata.reviewOrderId);
    if (!order) throw new RejectionReviewWebhookError("review_order_not_found");

    const validation = validateRejectionReviewCheckout(checkout, order);
    if (!validation.ok) {
      if (validation.failureType !== "terminal_order") {
        await dependencies.store.markInvalidCheckout(order.id, validation.failureType);
      }
      return true;
    }

    const resolvedTransactionId = checkout.transactionId
      || order.providerTransactionId
      || await dependencies.resolveTransactionId?.(checkout)
      || null;
    if (!resolvedTransactionId) throw new RejectionReviewWebhookError("transaction_id_unavailable");

    const markedPaid = await dependencies.store.markPaid({ order, checkout, transactionId: resolvedTransactionId });
    if (!markedPaid) return true;
    const pendingRevocation = await dependencies.store.findPendingRevocation({
      transactionId: resolvedTransactionId,
      providerOrderId: checkout.orderId,
      providerRequestId: checkout.requestId,
    });
    if (pendingRevocation) {
      await dependencies.store.revoke({ order, revocation: pendingRevocation });
      await dependencies.store.markRevocationProcessed(pendingRevocation.eventId, order.id);
      return true;
    }
    await dependencies.store.activateEntitlement(order);
    await dependencies.store.recordPurchaseCompleted({ order, checkout });
    return true;
  }

  const revocation = parseRejectionReviewRevocation(event);
  if (!revocation) return false;
  const order = await dependencies.store.findOrderByTransactionId(revocation.transactionId)
    || (revocation.providerOrderId
      ? await dependencies.store.findOrderByProviderOrderId(revocation.providerOrderId)
      : null)
    || (revocation.providerRequestId
      ? await dependencies.store.findOrderByProviderRequestId(revocation.providerRequestId)
      : null);
  const belongsToRejectionReview = Boolean(order)
    || revocation.markedAsRejectionReview
    || dependencies.isRejectionReviewProduct?.(revocation) === true;
  if (!belongsToRejectionReview) return false;
  await dependencies.store.recordRevocation(revocation);
  if (!order) return true;
  await dependencies.store.revoke({ order, revocation });
  await dependencies.store.markRevocationProcessed(revocation.eventId, order.id);
  return true;
}
