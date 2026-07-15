import assert from "node:assert/strict";
import {
  INTERNAL_ONLY_CASE_SECTIONS,
  QUALITY_CASE_STATUSES,
  getQualityCaseDisplayText,
  getQualityCaseTaskVisibleSections,
  isQualityCaseOverdue,
  validateQualityCaseAction,
} from "@/lib/quality-cases/contract";

assert.deepEqual(QUALITY_CASE_STATUSES, [
  "draft",
  "waiting_for_supplier",
  "supplier_submitted",
  "internal_review",
  "changes_requested_from_supplier",
  "ready_for_customer",
  "customer_review",
  "changes_requested_by_customer",
  "customer_accepted",
  "verification_planning",
  "verification_in_progress",
  "verification_submitted",
  "internal_verification_review",
  "verified_effective",
  "effectiveness_verification",
  "closed",
  "reopened",
]);

const sentToSupplier = validateQualityCaseAction("draft", {
  action: "send_to_supplier",
  actorRole: "coordinator",
  newDueAt: new Date("2026-07-20T00:00:00.000Z"),
});
assert.equal(sentToSupplier.ok, true);
if (sentToSupplier.ok) assert.equal(sentToSupplier.transition.to, "waiting_for_supplier");

const supplierSubmitted = validateQualityCaseAction("waiting_for_supplier", {
  action: "supplier_submit",
  actorRole: "external_guest",
});
assert.equal(supplierSubmitted.ok, true);
if (supplierSubmitted.ok) assert.equal(supplierSubmitted.transition.to, "supplier_submitted");

const incompleteReturn = validateQualityCaseAction("internal_review", {
  action: "request_supplier_changes",
  actorRole: "internal_member",
  comment: "Please revise.",
  newDueAt: new Date("2026-07-20T00:00:00.000Z"),
});
assert.deepEqual(incompleteReturn, { ok: false, error: "Identify at least one field that requires changes." });

const customerAccepted = validateQualityCaseAction("customer_review", {
  action: "customer_accept",
  actorRole: "customer",
});
assert.equal(customerAccepted.ok, true);
if (customerAccepted.ok) {
  assert.equal(customerAccepted.transition.to, "customer_accepted");
  assert.match(customerAccepted.transition.nextAction, /does not close/i);
}

const cannotCloseAfterAcceptance = validateQualityCaseAction("customer_accepted", {
  action: "close_case",
  actorRole: "coordinator",
  comment: "Closing now",
});
assert.deepEqual(cannotCloseAfterAcceptance, {
  ok: false,
  error: "Action close_case is not available while case is customer_accepted.",
});

const legacyCannotClose = validateQualityCaseAction("effectiveness_verification", {
  action: "close_case",
  actorRole: "coordinator",
  comment: "Legacy verification has no approved result.",
});
assert.equal(legacyCannotClose.ok, false);

const validClose = validateQualityCaseAction("verified_effective", {
  action: "close_case",
  actorRole: "coordinator",
  comment: "Effectiveness verified against the agreed check.",
});
assert.equal(validClose.ok, true);
if (validClose.ok) assert.equal(validClose.transition.to, "closed");

const supplierSections = getQualityCaseTaskVisibleSections("supplier_response");
const customerSections = getQualityCaseTaskVisibleSections("customer_review");
for (const section of INTERNAL_ONLY_CASE_SECTIONS) {
  assert.equal(supplierSections.includes(section as never), false, `supplier task must not expose ${section}`);
  assert.equal(customerSections.includes(section as never), false, `customer task must not expose ${section}`);
}
assert.equal(supplierSections.includes("customer_response"), false);
assert.equal(customerSections.includes("supplier_task"), false);

assert.equal(getQualityCaseDisplayText({
  original: { language: "zh-CN", text: "原始中文" },
  aiTranslation: { language: "en", text: "Unconfirmed AI text", generatedAt: "2026-07-10T00:00:00.000Z" },
  confirmedTranslation: { language: "en", text: "Confirmed English text", confirmedAt: "2026-07-10T00:00:00.000Z", confirmedBy: "user_1" },
}, "en"), "Confirmed English text");

assert.equal(isQualityCaseOverdue({
  status: "customer_accepted",
  dueAt: new Date("2026-07-09T00:00:00.000Z"),
  now: new Date("2026-07-10T00:00:00.000Z"),
}), true);
assert.equal(isQualityCaseOverdue({
  status: "closed",
  dueAt: new Date("2026-07-09T00:00:00.000Z"),
  now: new Date("2026-07-10T00:00:00.000Z"),
}), false);
