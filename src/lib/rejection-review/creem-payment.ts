import "server-only";
import {
  getRejectionReviewApiBase,
  getRejectionReviewProviderMode,
  REJECTION_REVIEW_CHECKOUT_TYPE,
  REJECTION_REVIEW_PRICE_CENTS,
  REJECTION_REVIEW_PRICE_VARIANT,
  type RejectionReviewProviderMode,
} from "@/lib/rejection-review/payment-policy";

type Environment = Record<string, string | undefined>;
type FetchImplementation = typeof fetch;
type JsonObject = Record<string, unknown>;

export class RejectionReviewProviderError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 502) {
    super(message);
    this.name = "RejectionReviewProviderError";
    this.code = code;
    this.status = status;
  }
}

export type RejectionReviewCreemConfig = {
  mode: RejectionReviewProviderMode;
  apiBase: string;
  apiKey: string;
  productId: string;
};

export type RejectionReviewCreemCheckout = {
  checkoutId: string;
  checkoutUrl: string;
  status: string;
  mode: RejectionReviewProviderMode;
  requestId: string;
  productId: string;
  orderId: string | null;
  transactionId: string | null;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function idFromValue(value: unknown) {
  if (typeof value === "string") return text(value);
  return isObject(value) ? text(value.id) || text(value.product_id) : null;
}

function transactionId(value: unknown) {
  if (typeof value === "string") return text(value);
  return isObject(value) ? text(value.id) : null;
}

function normalizeMode(value: unknown): RejectionReviewProviderMode | null {
  if (value === "test") return "test";
  if (value === "prod" || value === "production") return "production";
  return null;
}

function apiKeyForMode(mode: RejectionReviewProviderMode, env: Environment) {
  return mode === "test"
    ? env.CREEM_REJECTION_REVIEW_TEST_API_KEY
    : env.CREEM_REJECTION_REVIEW_API_KEY;
}

function productForMode(mode: RejectionReviewProviderMode, env: Environment) {
  return mode === "test"
    ? env.CREEM_TEST_PRODUCT_REJECTION_REVIEW_DEEP
    : env.CREEM_PRODUCT_REJECTION_REVIEW_DEEP;
}

export function getRejectionReviewCreemConfig(env: Environment = process.env): RejectionReviewCreemConfig {
  const mode = getRejectionReviewProviderMode(env);
  const apiKey = apiKeyForMode(mode, env)?.trim();
  const productId = productForMode(mode, env)?.trim();
  if (!apiKey) throw new RejectionReviewProviderError("provider_not_configured", "Rejection Review checkout is not configured", 503);
  if (!productId) throw new RejectionReviewProviderError("product_not_configured", "Rejection Review product is not configured", 503);
  return { mode, apiBase: getRejectionReviewApiBase(mode), apiKey, productId };
}

async function providerJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

function assertCheckoutUrl(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeCheckout(value: unknown, fallback?: {
  mode: RejectionReviewProviderMode;
  requestId: string;
  productId: string;
}): RejectionReviewCreemCheckout | null {
  if (!isObject(value)) return null;
  const order = isObject(value.order) ? value.order : null;
  const checkoutId = text(value.id);
  const checkoutUrl = assertCheckoutUrl(value.checkout_url);
  const status = text(value.status);
  const responseMode = value.mode === undefined || value.mode === null ? null : normalizeMode(value.mode);
  if (value.mode !== undefined && value.mode !== null && !responseMode) return null;
  const mode = responseMode || fallback?.mode || null;
  const requestId = text(value.request_id) || fallback?.requestId || null;
  const productId = idFromValue(value.product) || idFromValue(value.product_id) || fallback?.productId || null;
  if (!checkoutId || !checkoutUrl || !status || !mode || !requestId || !productId) return null;
  return {
    checkoutId,
    checkoutUrl,
    status,
    mode,
    requestId,
    productId,
    orderId: text(order?.id),
    transactionId: transactionId(order?.transaction),
  };
}

async function verifyConfiguredProduct(input: {
  config: RejectionReviewCreemConfig;
  fetchImpl: FetchImplementation;
}) {
  const url = new URL(`${input.config.apiBase}/products`);
  url.searchParams.set("product_id", input.config.productId);
  let response: Response;
  try {
    response = await input.fetchImpl(url, {
      method: "GET",
      headers: { "x-api-key": input.config.apiKey },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new RejectionReviewProviderError("product_verification_unavailable", "Secure checkout is temporarily unavailable");
  }
  if (!response.ok) {
    throw new RejectionReviewProviderError("product_verification_failed", "Secure checkout product could not be verified", 503);
  }
  const product = await providerJson(response);
  if (!isObject(product)) {
    throw new RejectionReviewProviderError("product_response_invalid", "Secure checkout product could not be verified", 503);
  }
  const mode = normalizeMode(product.mode);
  const price = typeof product.price === "number" && Number.isSafeInteger(product.price) ? product.price : null;
  const currency = text(product.currency)?.toUpperCase();
  const billingType = text(product.billing_type);
  const status = text(product.status);
  if (
    text(product.id) !== input.config.productId
    || mode !== input.config.mode
    || price !== REJECTION_REVIEW_PRICE_CENTS
    || currency !== "USD"
    || billingType !== "onetime"
    || status !== "active"
  ) {
    throw new RejectionReviewProviderError("product_configuration_mismatch", "Secure checkout product is not configured for the $99 one-time review", 503);
  }
}

export async function createRejectionReviewCreemCheckout(input: {
  config: RejectionReviewCreemConfig;
  requestId: string;
  reviewTaskId: string;
  reviewOrderId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  priceCents: number;
  fetchImpl?: FetchImplementation;
}) {
  if (input.priceCents !== REJECTION_REVIEW_PRICE_CENTS) {
    throw new RejectionReviewProviderError("unsupported_price", "Rejection Review checkout price is not supported", 409);
  }
  const fetchImpl = input.fetchImpl || fetch;
  await verifyConfiguredProduct({ config: input.config, fetchImpl });
  let response: Response;
  try {
    response = await fetchImpl(`${input.config.apiBase}/checkouts`, {
      method: "POST",
      headers: {
        "x-api-key": input.config.apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        product_id: input.config.productId,
        request_id: input.requestId,
        units: 1,
        customer: { email: input.customerEmail },
        success_url: input.successUrl,
        metadata: {
          checkoutType: REJECTION_REVIEW_CHECKOUT_TYPE,
          priceVariant: REJECTION_REVIEW_PRICE_VARIANT,
          reviewTaskId: input.reviewTaskId,
          reviewOrderId: input.reviewOrderId,
          userId: input.userId,
        },
      }),
    });
  } catch {
    throw new RejectionReviewProviderError("provider_unreachable", "Secure checkout is temporarily unavailable");
  }
  if (!response.ok) {
    throw new RejectionReviewProviderError(
      response.status >= 500 ? "provider_unavailable" : "provider_rejected_checkout",
      "Secure checkout could not be created",
      response.status >= 500 ? 502 : 503,
    );
  }
  const checkout = normalizeCheckout(await providerJson(response), {
    mode: input.config.mode,
    requestId: input.requestId,
    productId: input.config.productId,
  });
  if (!checkout) throw new RejectionReviewProviderError("provider_response_invalid", "Secure checkout returned an invalid response");
  if (
    checkout.mode !== input.config.mode
    || checkout.requestId !== input.requestId
    || checkout.productId !== input.config.productId
  ) {
    throw new RejectionReviewProviderError("provider_response_mismatch", "Secure checkout response did not match the request");
  }
  return checkout;
}

export async function retrieveRejectionReviewCreemCheckout(input: {
  config: RejectionReviewCreemConfig;
  checkoutId: string;
  fetchImpl?: FetchImplementation;
}) {
  const fetchImpl = input.fetchImpl || fetch;
  const url = new URL(`${input.config.apiBase}/checkouts`);
  url.searchParams.set("checkout_id", input.checkoutId);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { "x-api-key": input.config.apiKey },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new RejectionReviewProviderError("provider_reconciliation_unavailable", "Payment confirmation is temporarily unavailable");
  }
  if (!response.ok) {
    throw new RejectionReviewProviderError("provider_reconciliation_failed", "Payment confirmation could not be verified");
  }
  const checkout = normalizeCheckout(await providerJson(response));
  if (!checkout || checkout.checkoutId !== input.checkoutId || checkout.mode !== input.config.mode) {
    throw new RejectionReviewProviderError("provider_reconciliation_invalid", "Payment confirmation returned an invalid response");
  }
  return checkout;
}
