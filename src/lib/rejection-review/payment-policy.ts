export const REJECTION_REVIEW_CHECKOUT_TYPE = "rejection_review_deep_review" as const;
export const REJECTION_REVIEW_PRICE_VARIANT = "deep_review" as const;
export const REJECTION_REVIEW_PRICE_CENTS = 9900;
export const REJECTION_REVIEW_CURRENCY = "USD" as const;
export const REJECTION_REVIEW_RETURN_COOKIE = "reject_review_return" as const;

export type RejectionReviewProviderMode = "test" | "production";

type Environment = Record<string, string | undefined>;
type JsonObject = Record<string, unknown>;

export type RejectionReviewCheckoutCompleted = {
  eventId: string;
  checkoutId: string;
  requestId: string;
  mode: RejectionReviewProviderMode;
  productId: string;
  orderId: string;
  transactionId: string | null;
  priceAmountCents: number;
  paidAmountCents: number;
  currency: string;
  metadata: {
    checkoutType: string;
    priceVariant: string;
    reviewTaskId: string;
    reviewOrderId: string;
    userId: string;
  };
};

export type RejectionReviewRevocation = {
  kind: "refund" | "dispute";
  eventId: string;
  providerObjectId: string;
  transactionId: string;
  providerOrderId: string | null;
  providerRequestId: string | null;
  providerProductId: string | null;
  providerMode: RejectionReviewProviderMode | null;
  markedAsRejectionReview: boolean;
  amountCents: number | null;
  currency: string | null;
  reason: string | null;
};

export type RejectionReviewOrderForValidation = {
  id: string;
  taskId: string;
  userId: string;
  priceVariant: string;
  providerRequestId: string;
  providerProductId: string | null;
  providerCheckoutId?: string | null;
  providerOrderId?: string | null;
  providerTransactionId?: string | null;
  providerMode: string;
  expectedAmountCents: number;
  currency: string;
  status: string;
};

export type CheckoutValidationResult =
  | { ok: true }
  | { ok: false; failureType: string };

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function integerValue(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function productId(value: unknown) {
  if (typeof value === "string") return stringValue(value);
  if (!isObject(value)) return null;
  return stringValue(value.id) || stringValue(value.product_id);
}

function transactionId(value: unknown) {
  if (typeof value === "string") return stringValue(value);
  if (!isObject(value)) return null;
  return stringValue(value.id);
}

function normalizeProviderMode(value: unknown): RejectionReviewProviderMode | null {
  if (value === "test") return "test";
  if (value === "prod" || value === "production") return "production";
  return null;
}

function metadataFromObject(value: unknown) {
  if (!isObject(value)) return null;
  const checkoutType = stringValue(value.checkoutType);
  const priceVariant = stringValue(value.priceVariant);
  const reviewTaskId = stringValue(value.reviewTaskId);
  const reviewOrderId = stringValue(value.reviewOrderId);
  const userId = stringValue(value.userId);
  if (!checkoutType || !priceVariant || !reviewTaskId || !reviewOrderId || !userId) return null;
  return { checkoutType, priceVariant, reviewTaskId, reviewOrderId, userId };
}

export function getRejectionReviewProviderMode(env: Environment = process.env): RejectionReviewProviderMode {
  if (env.VERCEL_ENV === "preview") return "test";
  if (env.VERCEL_ENV === "production") return "production";
  return env.REJECTION_REVIEW_PAYMENT_MODE === "production" ? "production" : "test";
}

export function getRejectionReviewApiBase(mode: RejectionReviewProviderMode) {
  return mode === "test" ? "https://test-api.creem.io/v1" : "https://api.creem.io/v1";
}

function configuredUrl(value: string | undefined, defaultProtocol = "https") {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `${defaultProtocol}://${trimmed}`);
  } catch {
    return null;
  }
}

export function getRejectionReviewSuccessOrigin(env: Environment = process.env) {
  const vercelEnvironment = env.VERCEL_ENV;
  const configured = vercelEnvironment === "preview"
    ? configuredUrl(env.VERCEL_URL)
    : configuredUrl(env.REJECTION_REVIEW_APP_URL)
      || configuredUrl(env.BETTER_AUTH_URL)
      || configuredUrl(env.NEXT_PUBLIC_APP_URL)
      || configuredUrl(env.VERCEL_PROJECT_PRODUCTION_URL);

  if (configured) {
    if (vercelEnvironment && configured.protocol !== "https:") {
      throw new Error("Rejection Review success URL must use HTTPS on Vercel");
    }
    return configured.origin;
  }
  if (!vercelEnvironment && env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("A trusted Rejection Review application URL is not configured");
}

export function buildRejectionReviewSuccessUrl(orderId: string, env: Environment = process.env) {
  const url = new URL("/8d-report-review-service/purchase-complete", getRejectionReviewSuccessOrigin(env));
  url.searchParams.set("review_order", orderId);
  return url.toString();
}

export function isMarkedRejectionReviewCheckoutEvent(value: unknown) {
  if (!isObject(value) || value.eventType !== "checkout.completed" || !isObject(value.object)) return false;
  const requestId = stringValue(value.object.request_id);
  const metadata = isObject(value.object.metadata) ? value.object.metadata : null;
  return requestId?.startsWith("reject-review:") === true
    || metadata?.checkoutType === REJECTION_REVIEW_CHECKOUT_TYPE;
}

export function parseRejectionReviewCheckoutCompleted(value: unknown): RejectionReviewCheckoutCompleted | null {
  if (!isMarkedRejectionReviewCheckoutEvent(value) || !isObject(value) || !isObject(value.object)) return null;
  const checkout = value.object;
  const order = isObject(checkout.order) ? checkout.order : null;
  const eventId = stringValue(value.id);
  const checkoutId = stringValue(checkout.id);
  const requestId = stringValue(checkout.request_id);
  const mode = normalizeProviderMode(checkout.mode);
  const configuredProductId = productId(checkout.product) || productId(order?.product);
  const providerOrderId = stringValue(order?.id);
  const providerTransactionId = transactionId(order?.transaction);
  const priceAmountCents = integerValue(order?.amount);
  const paidAmountCents = integerValue(order?.amount_paid)
    ?? integerValue(order?.amount_due)
    ?? priceAmountCents;
  const currency = stringValue(order?.currency)?.toUpperCase() || null;
  const metadata = metadataFromObject(checkout.metadata);
  const checkoutStatus = stringValue(checkout.status);
  const orderStatus = stringValue(order?.status);
  const subscription = checkout.subscription;

  if (
    !eventId || !checkoutId || !requestId || !mode || !configuredProductId
    || !providerOrderId || priceAmountCents === null || paidAmountCents === null || !currency || !metadata
    || checkout.object !== "checkout" || checkoutStatus !== "completed" || orderStatus !== "paid"
    || (subscription !== undefined && subscription !== null)
  ) return null;

  return {
    eventId,
    checkoutId,
    requestId,
    mode,
    productId: configuredProductId,
    orderId: providerOrderId,
    transactionId: providerTransactionId,
    priceAmountCents,
    paidAmountCents,
    currency,
    metadata,
  };
}

export function parseRejectionReviewRevocation(value: unknown): RejectionReviewRevocation | null {
  if (!isObject(value) || !isObject(value.object)) return null;
  const eventType = stringValue(value.eventType);
  const kind = eventType === "refund.created" ? "refund" : eventType === "dispute.created" ? "dispute" : null;
  if (!kind) return null;
  const object = value.object;
  const providerTransaction = object.transaction;
  const providerTransactionId = transactionId(providerTransaction);
  const providerOrder = isObject(object.order) ? object.order : null;
  const providerCheckout = isObject(object.checkout) ? object.checkout : null;
  const checkoutMetadata = isObject(providerCheckout?.metadata) ? providerCheckout.metadata : null;
  const providerOrderId = stringValue(providerOrder?.id)
    || (isObject(providerTransaction) ? stringValue(providerTransaction.order) : null);
  const providerRequestId = stringValue(providerCheckout?.request_id);
  const configuredProductId = productId(providerOrder?.product)
    || productId(providerCheckout?.product)
    || (isObject(object.subscription) ? productId(object.subscription.product) : null);
  const providerMode = normalizeProviderMode(object.mode)
    || normalizeProviderMode(providerOrder?.mode)
    || normalizeProviderMode(providerCheckout?.mode);
  const eventId = stringValue(value.id);
  const providerObjectId = stringValue(object.id);
  if (!eventId || !providerObjectId || !providerTransactionId) return null;
  if (kind === "refund" && object.status !== "succeeded") return null;
  return {
    kind,
    eventId,
    providerObjectId,
    transactionId: providerTransactionId,
    providerOrderId,
    providerRequestId,
    providerProductId: configuredProductId,
    providerMode,
    markedAsRejectionReview: providerRequestId?.startsWith("reject-review:") === true
      || checkoutMetadata?.checkoutType === REJECTION_REVIEW_CHECKOUT_TYPE,
    amountCents: kind === "refund"
      ? (isObject(providerTransaction) ? integerValue(providerTransaction.refunded_amount) : null)
        ?? integerValue(object.refund_amount)
      : integerValue(object.amount),
    currency: stringValue(kind === "refund" ? object.refund_currency : object.currency)?.toUpperCase() || null,
    reason: stringValue(object.reason),
  };
}

export function validateRejectionReviewCheckout(
  checkout: RejectionReviewCheckoutCompleted,
  order: RejectionReviewOrderForValidation,
): CheckoutValidationResult {
  if (checkout.metadata.checkoutType !== REJECTION_REVIEW_CHECKOUT_TYPE) return { ok: false, failureType: "checkout_type_mismatch" };
  if (checkout.metadata.priceVariant !== order.priceVariant) return { ok: false, failureType: "price_variant_mismatch" };
  if (order.priceVariant !== REJECTION_REVIEW_PRICE_VARIANT) return { ok: false, failureType: "unsupported_price_variant" };
  if (checkout.metadata.reviewOrderId !== order.id) return { ok: false, failureType: "order_metadata_mismatch" };
  if (checkout.metadata.reviewTaskId !== order.taskId) return { ok: false, failureType: "task_metadata_mismatch" };
  if (checkout.metadata.userId !== order.userId) return { ok: false, failureType: "user_metadata_mismatch" };
  if (checkout.requestId !== order.providerRequestId) return { ok: false, failureType: "request_id_mismatch" };
  if (!order.providerProductId || checkout.productId !== order.providerProductId) return { ok: false, failureType: "product_mismatch" };
  if (order.providerCheckoutId && checkout.checkoutId !== order.providerCheckoutId) return { ok: false, failureType: "checkout_id_mismatch" };
  if (order.providerOrderId && checkout.orderId !== order.providerOrderId) return { ok: false, failureType: "provider_order_id_mismatch" };
  if (order.providerTransactionId && checkout.transactionId && checkout.transactionId !== order.providerTransactionId) {
    return { ok: false, failureType: "transaction_id_mismatch" };
  }
  if (checkout.mode !== order.providerMode) return { ok: false, failureType: "provider_mode_mismatch" };
  if (checkout.priceAmountCents !== order.expectedAmountCents) return { ok: false, failureType: "amount_mismatch" };
  if (checkout.paidAmountCents < order.expectedAmountCents) return { ok: false, failureType: "underpaid" };
  if (checkout.currency !== order.currency || checkout.currency !== REJECTION_REVIEW_CURRENCY) return { ok: false, failureType: "currency_mismatch" };
  if (["refunded", "disputed", "cancelled", "failed"].includes(order.status)) return { ok: false, failureType: "terminal_order" };
  return { ok: true };
}

export function hasRejectionReviewPaidAccess(input: {
  orderStatus?: string | null;
  entitlementStatus?: string | null;
  deliverableReadyAt?: Date | null;
  orderRevokedAt?: Date | null;
  entitlementRevokedAt?: Date | null;
}) {
  return input.orderStatus === "paid"
    && input.entitlementStatus === "active"
    && Boolean(input.deliverableReadyAt)
    && !input.orderRevokedAt
    && !input.entitlementRevokedAt;
}

export function getRejectionReviewDeliveryStatus(input: {
  orderStatus?: string | null;
  deliverableReadyAt?: Date | null;
}) {
  if (input.orderStatus === "refunded" || input.orderStatus === "disputed") return "revoked" as const;
  if (input.orderStatus === "paid" && input.deliverableReadyAt) return "ready" as const;
  if (input.orderStatus === "paid") return "in_progress" as const;
  return "not_started" as const;
}
