import assert from "node:assert/strict";
import {
  createRejectionReviewCreemCheckout,
  getRejectionReviewCreemConfig,
  RejectionReviewProviderError,
  retrieveRejectionReviewCreemCheckout,
} from "@/lib/rejection-review/creem-payment";

async function main() {
const validProduct = {
  id: "prod_review_test",
  mode: "test",
  price: 9900,
  currency: "USD",
  billing_type: "onetime",
  status: "active",
};
const previewConfig = getRejectionReviewCreemConfig({
  VERCEL_ENV: "preview",
  CREEM_REJECTION_REVIEW_TEST_API_KEY: "test_key_do_not_log",
  CREEM_TEST_PRODUCT_REJECTION_REVIEW_DEEP: "prod_review_test",
  CREEM_REJECTION_REVIEW_API_KEY: "live_key_do_not_log",
  CREEM_PRODUCT_REJECTION_REVIEW_DEEP: "prod_review_live",
});
assert.equal(previewConfig.mode, "test");
assert.equal(previewConfig.apiBase, "https://test-api.creem.io/v1");
assert.equal(previewConfig.productId, "prod_review_test");
const productionConfig = getRejectionReviewCreemConfig({
  VERCEL_ENV: "production",
  CREEM_REJECTION_REVIEW_TEST_API_KEY: "test_key_must_not_be_used",
  CREEM_TEST_PRODUCT_REJECTION_REVIEW_DEEP: "prod_review_test",
  CREEM_REJECTION_REVIEW_API_KEY: "live_key_do_not_log",
  CREEM_PRODUCT_REJECTION_REVIEW_DEEP: "prod_review_live",
});
assert.equal(productionConfig.mode, "production");
assert.equal(productionConfig.apiBase, "https://api.creem.io/v1");
assert.equal(productionConfig.productId, "prod_review_live");

let requestedUrl = "";
let requestedBody: Record<string, unknown> = {};
const checkout = await createRejectionReviewCreemCheckout({
  config: previewConfig,
  requestId: "reject-review:order-1",
  reviewTaskId: "task-1",
  reviewOrderId: "order-1",
  userId: "user-1",
  customerEmail: "buyer@factory.com",
  successUrl: "https://preview.example.com/8d-report-review-service/purchase-complete?review_order=order-1",
  priceCents: 9900,
  fetchImpl: async (input, init) => {
    requestedUrl = String(input);
    if (requestedUrl.includes("/products?")) return Response.json(validProduct);
    requestedBody = JSON.parse(String(init?.body));
    return Response.json({
      id: "ch_review_1",
      checkout_url: "https://checkout.creem.io/ch_review_1",
      status: "pending",
      mode: "test",
      request_id: "reject-review:order-1",
      product: "prod_review_test",
      order: { id: "ord_review_1" },
    });
  },
});
assert.equal(requestedUrl, "https://test-api.creem.io/v1/checkouts");
assert.equal(requestedBody.request_id, "reject-review:order-1");
assert.equal("custom_price" in requestedBody, false);
assert.equal(requestedBody.product_id, "prod_review_test");
assert.deepEqual(requestedBody.metadata, {
  checkoutType: "rejection_review_deep_review",
  priceVariant: "deep_review",
  reviewTaskId: "task-1",
  reviewOrderId: "order-1",
  userId: "user-1",
});
assert.equal(checkout.checkoutUrl, "https://checkout.creem.io/ch_review_1");

let retrieveUrl = "";
const retrieved = await retrieveRejectionReviewCreemCheckout({
  config: previewConfig,
  checkoutId: "ch_review_1",
  fetchImpl: async (input) => {
    retrieveUrl = String(input);
    return Response.json({
      id: "ch_review_1",
      checkout_url: "https://checkout.creem.io/ch_review_1",
      status: "completed",
      mode: "test",
      request_id: "reject-review:order-1",
      product: "prod_review_test",
      order: { id: "ord_review_1", transaction: "tran_review_1" },
    });
  },
});
assert.match(retrieveUrl, /^https:\/\/test-api\.creem\.io\/v1\/checkouts\?checkout_id=ch_review_1$/);
assert.equal(retrieved.transactionId, "tran_review_1");

let providerError: unknown;
try {
  await createRejectionReviewCreemCheckout({
    config: previewConfig,
    requestId: "reject-review:order-2",
    reviewTaskId: "task-2",
    reviewOrderId: "order-2",
    userId: "user-2",
    customerEmail: "buyer@factory.com",
    successUrl: "https://preview.example.com/success",
    priceCents: 9900,
    fetchImpl: async (input) => String(input).includes("/products?")
      ? Response.json(validProduct)
      : new Response(JSON.stringify({ secret: "provider-sensitive-body" }), { status: 400 }),
  });
} catch (error) {
  providerError = error;
}
assert.ok(providerError instanceof RejectionReviewProviderError);
assert.equal(providerError.message.includes("provider-sensitive-body"), false);

assert.throws(
  () => getRejectionReviewCreemConfig({
    VERCEL_ENV: "preview",
    CREEM_API_KEY: "must_not_be_used_for_preview",
    CREEM_TEST_PRODUCT_REJECTION_REVIEW_DEEP: "prod_review_test",
  }),
  (error: unknown) => error instanceof RejectionReviewProviderError && error.code === "provider_not_configured",
);

let unsupportedPriceError: unknown;
try {
  await createRejectionReviewCreemCheckout({
    config: previewConfig,
    requestId: "reject-review:order-3",
    reviewTaskId: "task-3",
    reviewOrderId: "order-3",
    userId: "user-3",
    customerEmail: "buyer@factory.com",
    successUrl: "https://preview.example.com/success",
    priceCents: 3900,
    fetchImpl: async () => { throw new Error("fetch must not run"); },
  });
} catch (error) {
  unsupportedPriceError = error;
}
assert.ok(unsupportedPriceError instanceof RejectionReviewProviderError);
assert.equal(unsupportedPriceError.code, "unsupported_price");

let responseMismatchError: unknown;
try {
  await createRejectionReviewCreemCheckout({
    config: previewConfig,
    requestId: "reject-review:order-4",
    reviewTaskId: "task-4",
    reviewOrderId: "order-4",
    userId: "user-4",
    customerEmail: "buyer@factory.com",
    successUrl: "https://preview.example.com/success",
    priceCents: 9900,
    fetchImpl: async (input) => String(input).includes("/products?")
      ? Response.json(validProduct)
      : Response.json({
          id: "ch_wrong_product",
          checkout_url: "https://checkout.creem.io/ch_wrong_product",
          status: "pending",
          mode: "test",
          request_id: "reject-review:order-4",
          product: "prod_not_the_stored_sku",
        }),
  });
} catch (error) {
  responseMismatchError = error;
}
assert.ok(responseMismatchError instanceof RejectionReviewProviderError);
assert.equal(responseMismatchError.code, "provider_response_mismatch");

console.log("8D Reject Check Creem client tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
