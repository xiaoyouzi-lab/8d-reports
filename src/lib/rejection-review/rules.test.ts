import assert from "node:assert/strict";
import { runDeterministicRejectionReview } from "@/lib/rejection-review/rules";
import { toFreeRejectionRiskPreview } from "@/lib/rejection-review/schema";

const base = `
D1 Team
Quality engineer Alice owns the response; production and process engineering reviewed it.
D2 Problem Description
Part PN-104, lot L2408, had 12 solder bridges in 600 units at final inspection on 2026-07-28. Drawing tolerance is 0.20 mm maximum.
D3 Containment
All lot L2408 warehouse and WIP stock was held. Quality owned 100% sorting; the signed record found 12 defects and verified replacement stock before shipment.
D4 Root Cause
Occurrence cause: reflow zone 6 temperature controller drifted after the thermocouple connector loosened. Escape cause: final AOI recipe excluded the affected pad region. Evidence: calibration log and AOI recipe revision review.
D5 Corrective Action
The connector was replaced with a keyed locking connector and a controller alarm interlock. AOI recipe coverage was revised. Owners: maintenance and quality.
D6 Implementation and Verification
Implemented 2026-07-29 under work order WO-88 and recipe revision AOI-17. Verification sampled 3 lots / 1800 units from 2026-07-29 to 2026-08-01; acceptance criterion zero solder bridges and result was 0/1800, passed.
D7 Prevention
PFMEA and control plan were updated. Horizontal deployment reviewed all similar reflow lines and PCBA families; records HD-12 and CP-44 attached.
D8 Closure
Quality manager reviewed the evidence and approved internal closure on 2026-08-01. Customer acceptance is not claimed.
`;

function ids(text: string) {
  return runDeterministicRejectionReview(text).findings.map((finding) => finding.id);
}

assert.ok(ids(base.replace(/Occurrence cause:[^\n]+/, "Occurrence cause: employee negligence during setup."))
  .includes("root-cause-human-blame"), "flags employee negligence as an unproven systemic cause");

assert.ok(ids(base.replace(/The connector was replaced[^\n]+/, "Corrective action: retrain the operator."))
  .includes("action-training-only"), "flags training-only action");

assert.ok(ids(base.replace(/The connector was replaced[^\n]+/, "Corrective action: increase 100% inspection."))
  .includes("action-inspection-only"), "flags inspection-only action");

assert.ok(ids(base.replace(/Escape cause:[^\n]+/, "Escape cause: reflow zone 6 temperature controller drifted after the thermocouple connector loosened."))
  .includes("occurrence-escape-same"), "flags identical occurrence and escape causes");

const mismatch = base
  .replace(/Occurrence cause:[^\n]+/, "Occurrence cause: machine temperature controller failed.")
  .replace(/The connector was replaced[^\n]+/, "Corrective action: retrain the operator.");
assert.ok(ids(mismatch).includes("action-not-linked-to-cause"), "flags action that does not address technical cause");

const noImplementation = base.replace(/Implemented 2026[^\n]+/, "Implementation is planned after customer review.");
assert.ok(ids(noImplementation).includes("implementation-evidence-missing"), "flags missing implementation evidence");

const noCriteria = base.replace(/Verification sampled[^\n]+/, "Verification will be performed after implementation.");
assert.ok(ids(noCriteria).includes("verification-criteria-incomplete"), "flags missing verification criteria");

const vague = base.replace("coverage was revised", "coverage was improved appropriately");
assert.ok(ids(vague).includes("wording-vague-unmeasurable"), "flags vague wording without changing stated facts");

const incomplete = runDeterministicRejectionReview("D2 Problem Description\nCustomer reported a defect.");
assert.equal(incomplete.status, "not_suitable_to_submit");
assert.ok(incomplete.findings.every((finding) => finding.source.type !== "report_excerpt" || Boolean(finding.source.excerpt)));
assert.equal(incomplete.evidencePolicy.inventedFactsAllowed, false);

const highQuality = runDeterministicRejectionReview(base);
assert.equal(highQuality.findings.filter((finding) => ["critical", "high"].includes(finding.severity)).length, 0,
  "does not invent material rejection risks for a complete report");
assert.equal(highQuality.status, "submittable_with_risk");

const free = toFreeRejectionRiskPreview(incomplete);
assert.ok(free.topRejectionRisks.length <= 3);
assert.equal(free.fullReviewExample.redacted, true);

console.log("8D Reject Check deterministic acceptance cases passed.");
