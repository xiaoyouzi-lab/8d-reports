import assert from "node:assert/strict";
import { buildFoundingCaseData } from "./founding-case";
import { smtPcbaSolderDefectFixture } from "@/lib/p0-plus/__fixtures__/smt-pcba-solder-defect";

const mapped = buildFoundingCaseData({
  purchaseId: "purchase-1",
  rawInput: "Customer complaint source",
  previewPayload: smtPcbaSolderDefectFixture.response,
});
assert.ok(mapped);
assert.equal(mapped?.caseData.foundingCasePurchaseId, "purchase-1");
assert.equal(mapped?.caseData.originalComplaint, "Customer complaint source");
assert.ok(mapped?.title);
assert.equal(buildFoundingCaseData({ purchaseId: "bad", rawInput: "x", previewPayload: {} }), null);

console.log("Founding Case mapping tests passed.");
