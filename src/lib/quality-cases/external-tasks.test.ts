import assert from "node:assert/strict";
import { getQualityCaseTaskVisibleSections, validateQualityCaseAction } from "@/lib/quality-cases/contract";
import { projectQualityCaseForExternalTask } from "@/lib/quality-cases/external-projection";
import {
  buildExternalCaseDataUpdate,
  parseSupplierFollowUpInstructions,
} from "@/lib/quality-cases/external-tasks";

const privateSections = { case_summary: { title: "Visible" }, supplier_task: { requiredFields: ["rootCause"] }, supplier_evidence: [], customer_response: { response: "Visible" }, customer_evidence: [], customer_comments: [] };
assert.deepEqual(getQualityCaseTaskVisibleSections("supplier_response"), ["case_summary", "supplier_task", "supplier_evidence"]);
assert.deepEqual(projectQualityCaseForExternalTask("supplier_response", privateSections), { case_summary: { title: "Visible" }, supplier_task: { requiredFields: ["rootCause"] }, supplier_evidence: [] });
assert.equal(validateQualityCaseAction("waiting_for_supplier", { action: "supplier_submit", actorRole: "external_guest" }).ok, true);
assert.equal(validateQualityCaseAction("customer_review", { action: "customer_accept", actorRole: "external_guest" }).ok, true);
assert.equal(validateQualityCaseAction("customer_review", { action: "close_case", actorRole: "external_guest", comment: "no" }).ok, false);

const firstCustomerChange = buildExternalCaseDataUpdate({
  previousCaseData: {},
  taskType: "customer_review",
  action: "request_customer_changes",
  response: "",
  comment: "Please add validation evidence.",
  requestedFieldIds: ["effectiveness_verification"],
  now: new Date("2026-07-10T00:00:00.000Z"),
});
const secondCustomerChange = buildExternalCaseDataUpdate({
  previousCaseData: firstCustomerChange.caseData,
  taskType: "customer_review",
  action: "request_customer_changes",
  response: "",
  comment: "Please clarify the root cause.",
  requestedFieldIds: ["root_cause"],
  now: new Date("2026-07-11T00:00:00.000Z"),
});
assert.equal(
  (((secondCustomerChange.caseData as Record<string, unknown>).customerResponse as { changeRequests: unknown[] }).changeRequests).length,
  2,
  "customer return history must be appended rather than overwritten",
);
assert.deepEqual(Object.keys(secondCustomerChange.diff), ["customerResponse"]);

const supplierUpdate = buildExternalCaseDataUpdate({
  previousCaseData: { supplierResponse: { response: "old" } },
  taskType: "supplier_response",
  action: "supplier_submit",
  response: "new investigation and evidence",
  comment: "",
  requestedFieldIds: [],
  now: new Date("2026-07-10T00:00:00.000Z"),
});
assert.equal(
  (((supplierUpdate.diff as unknown as Record<string, { after: unknown }>).supplierResponse.after) as { response: string }).response,
  "new investigation and evidence",
);

assert.deepEqual(
  parseSupplierFollowUpInstructions({
    source: "internal_review",
    reason: "Please add the missing system-control explanation.",
    questions: ["Why could the mistake occur?", "Why was it not detected?"],
    requestedFieldIds: ["occurrence_analysis", "escape_analysis"],
    internalNotes: "must not be projected",
  }),
  {
    source: "internal_review",
    reason: "Please add the missing system-control explanation.",
    questions: ["Why could the mistake occur?", "Why was it not detected?"],
    requestedFieldIds: ["occurrence_analysis", "escape_analysis"],
  },
);
assert.equal(
  parseSupplierFollowUpInstructions({
    source: "ai_quality_reviewer",
    reason: "AI cannot directly instruct the supplier.",
    questions: ["Forbidden"],
  }),
  null,
);
