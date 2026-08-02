import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { getCreemWebhookSecrets, verifyCreemWebhookSignature } from "@/lib/rejection-review/webhook-policy";

const payload = JSON.stringify({ id: "evt_test", eventType: "checkout.completed" });
const testSecret = "test_webhook_secret";
const productionSecret = "production_webhook_secret";
const testSignature = createHmac("sha256", testSecret).update(payload).digest("hex");
const productionSignature = createHmac("sha256", productionSecret).update(payload).digest("hex");

const previewEnv = {
  VERCEL_ENV: "preview",
  CREEM_REJECTION_REVIEW_TEST_WEBHOOK_SECRET: testSecret,
  CREEM_WEBHOOK_SECRET: productionSecret,
};
assert.deepEqual(getCreemWebhookSecrets(previewEnv), [testSecret]);
assert.equal(verifyCreemWebhookSignature(payload, testSignature, previewEnv), true);
assert.equal(verifyCreemWebhookSignature(payload, productionSignature, previewEnv), false);

const productionEnv = {
  VERCEL_ENV: "production",
  CREEM_REJECTION_REVIEW_WEBHOOK_SECRET: productionSecret,
  CREEM_WEBHOOK_SECRET: "legacy_production_secret",
};
assert.deepEqual(getCreemWebhookSecrets(productionEnv), [productionSecret, "legacy_production_secret"]);
assert.equal(verifyCreemWebhookSignature(payload, productionSignature, productionEnv), true);
assert.equal(verifyCreemWebhookSignature(payload, null, productionEnv), false);

console.log("Rejection Review webhook secret isolation tests passed.");
