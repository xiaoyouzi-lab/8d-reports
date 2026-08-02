import assert from "node:assert/strict";
import JSZip from "jszip";
import { runDeterministicRejectionReview } from "@/lib/rejection-review/rules";
import {
  generateRejectionReviewWordPackage,
  rejectionReviewFilename,
} from "@/lib/rejection-review/word-export";

async function main() {
  assert.equal(
    rejectionReviewFilename("review/unsafe id"),
    "review_unsafe_id_rejection_risk_review.docx",
  );

  const review = runDeterministicRejectionReview(`
D2 Problem Description
Customer reported a loose connector.
D4 Root Cause
Root cause: employee negligence.
D5 Corrective Action
Corrective action: retrain the operator.
`);
  const output = await generateRejectionReviewWordPackage({
    reviewId: "review-123",
    generatedAt: new Date("2026-08-02T00:00:00.000Z"),
    review,
    rewrites: [{
      section: "D2",
      sourceExcerpt: "Customer reported a loose connector.",
      suggestedEnglish: "The customer reported a loose connector on [ADD VERIFIED PART/LOT].",
      requiredPlaceholders: ["Verified part and lot"],
    }],
  });

  assert.equal(Buffer.isBuffer(output), true);
  assert.ok(output.length > 1_000);
  const zip = await JSZip.loadAsync(output);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  assert.ok(documentXml?.includes("Complete Rejection Risk Review"));
  assert.ok(documentXml?.includes("Root cause stops at human error"));
  assert.ok(documentXml?.includes("[ADD VERIFIED PART/LOT]"));
  assert.ok(!documentXml?.includes("root cause was confirmed"));
}

main().then(() => {
  console.log("8D Reject Check DOCX package tests passed.");
}).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
