import assert from "node:assert/strict";
import {
  classifyReviewActor,
  normalizeReviewTrafficSource,
  sanitizeReviewEventMetadata,
} from "@/lib/rejection-review/event-policy";

process.env.REJECTION_REVIEW_OWNER_EMAILS = "owner@8d-reports.com";
process.env.REJECTION_REVIEW_TEST_EMAILS = "qa@8d-reports.com";
assert.equal(classifyReviewActor({ email: "OWNER@8d-reports.com", providerMode: "production" }), "owner");
assert.equal(classifyReviewActor({ email: "buyer@example.com", providerMode: "production" }), "test");
assert.equal(classifyReviewActor({ email: "buyer@factory.com", providerMode: "test" }), "test");
assert.equal(classifyReviewActor({ email: "buyer@factory.com", providerMode: "production" }), "external");
assert.equal(classifyReviewActor({}), "unknown");
assert.equal(normalizeReviewTrafficSource("LinkedIn / SQE Group"), "linkedin-sqe-group");
assert.deepEqual(sanitizeReviewEventMetadata({
  sourceType: "docx",
  resultStatus: "high_risk",
  inputText: "customer secret",
  filename: "secret.docx",
  aiOutput: { secret: true },
}), { sourceType: "docx", resultStatus: "high_risk" });

console.log("8D Reject Check event privacy tests passed.");
