import assert from "node:assert/strict";
import {
  buildCustomerAuthorizedResponse,
  buildEightDOutputContent,
  selectComplaintForEightDOutput,
} from "./output-content";
import { canCreateEightDOutput } from "./outputs";

assert.equal(canCreateEightDOutput("8d"), true);
assert.equal(canCreateEightDOutput("scar"), false);
assert.equal(canCreateEightDOutput(null), false);

const draftOnly = {
  original: { language: "zh-CN", text: "客户发现批次不良" },
  aiTranslation: { language: "en", text: "The customer found a batch defect." },
};

assert.equal(
  selectComplaintForEightDOutput({
    languageMode: "en",
    caseComplaint: "客户发现批次不良",
    translation: draftOnly,
  }).ok,
  false,
  "AI-only text must never become an English export",
);

const confirmed = {
  ...draftOnly,
  confirmedTranslation: {
    language: "en",
    text: "The customer identified a defect in the affected lot.",
  },
};
const english = selectComplaintForEightDOutput({
  languageMode: "en",
  caseComplaint: "客户发现批次不良",
  translation: confirmed,
});
assert.deepEqual(english, {
  ok: true,
  value: "The customer identified a defect in the affected lot.",
});
const bilingual = selectComplaintForEightDOutput({
  languageMode: "bilingual",
  caseComplaint: "客户发现批次不良",
  translation: confirmed,
});
assert.equal(bilingual.ok, true);
if (bilingual.ok) {
  assert.match(bilingual.value, /客户发现批次不良/);
  assert.match(bilingual.value, /human-confirmed/);
  assert.doesNotMatch(bilingual.value, /The customer found a batch defect/);
}

assert.equal(
  buildCustomerAuthorizedResponse({
    translations: [{ ...draftOnly, fieldPath: "complaint_summary" }],
  }).ok,
  false,
  "AI-only text must never become a customer-review response",
);

const customerResponse = buildCustomerAuthorizedResponse({
  translations: [
    { ...confirmed, fieldPath: "complaint_summary" },
    {
      fieldPath: "corrective_action",
      original: { language: "zh-CN", text: "增加首件确认" },
      aiTranslation: { language: "en", text: "Add a check." },
      confirmedTranslation: { language: "en", text: "Add first-piece confirmation." },
    },
  ],
});
assert.equal(customerResponse.ok, true);
if (customerResponse.ok) {
  assert.match(customerResponse.value.text, /Complaint summary/);
  assert.match(customerResponse.value.text, /Corrective action/);
  assert.match(customerResponse.value.text, /Add first-piece confirmation/);
  assert.doesNotMatch(customerResponse.value.text, /客户发现批次不良|Add a check/);
  assert.deepEqual(customerResponse.value.fieldPaths, ["complaint_summary", "corrective_action"]);
  assert.equal(customerResponse.value.complaintSummary, "The customer identified a defect in the affected lot.");
  assert.deepEqual(customerResponse.value.sections, [
    {
      fieldPath: "complaint_summary",
      label: "Complaint summary",
      text: "The customer identified a defect in the affected lot.",
    },
    {
      fieldPath: "corrective_action",
      label: "Corrective action",
      text: "Add first-piece confirmation.",
    },
  ]);
}

const mappedFields = buildEightDOutputContent({
  languageMode: "en",
  caseComplaint: "客户发现批次不良",
  translations: [
    { ...confirmed, fieldPath: "complaint_summary" },
    {
      fieldPath: "corrective_action",
      original: { language: "zh-CN", text: "更换筛选工装并增加首件确认" },
      aiTranslation: { language: "en", text: "Replace the fixture." },
      confirmedTranslation: {
        language: "en",
        text: "Replace the screening fixture and add first-piece confirmation.",
      },
    },
    {
      fieldPath: "root_cause",
      original: { language: "zh-CN", text: "待验证" },
      aiTranslation: { language: "en", text: "Unverified root cause." },
    },
  ],
});
assert.equal(mappedFields.ok, true);
if (mappedFields.ok) {
  assert.equal(
    mappedFields.value.selectedCorrectiveAction,
    "Replace the screening fixture and add first-piece confirmation.",
  );
  assert.equal(mappedFields.value.confirmedRootCause, undefined);
  assert.doesNotMatch(
    JSON.stringify(mappedFields.value),
    /Unverified root cause|Replace the fixture\./,
  );
}

const bilingualMappedField = buildEightDOutputContent({
  languageMode: "bilingual",
  caseComplaint: "客户发现批次不良",
  translations: [
    { ...confirmed, fieldPath: "complaint_summary" },
    {
      fieldPath: "containment",
      original: { language: "zh-CN", text: "隔离该批次并停止发货" },
      aiTranslation: { language: "en", text: "Isolate the lot." },
      confirmedTranslation: {
        language: "en",
        text: "Quarantine the affected lot and stop shipment.",
      },
    },
  ],
});
assert.equal(bilingualMappedField.ok, true);
if (bilingualMappedField.ok) {
  assert.match(bilingualMappedField.value.containmentDescription || "", /隔离该批次/);
  assert.match(bilingualMappedField.value.containmentDescription || "", /Quarantine the affected lot/);
  assert.doesNotMatch(bilingualMappedField.value.containmentDescription || "", /Isolate the lot\./);
}
