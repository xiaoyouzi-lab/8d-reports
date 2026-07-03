import assert from "node:assert/strict";
import {
  P0_PLUS_REQUIRED_SECTION_CHECKS,
  P0_PLUS_SOURCE_STATUSES,
  validateP0PlusPreviewResponse,
  type P0PlusNextActionType,
  type P0PlusPreviewResponse,
} from "@/lib/p0-plus/schema";
import { mapP0PlusPreviewToReportDataPatch } from "@/lib/p0-plus/mapper";
import { P0_PLUS_AI_CONTRACT_PROMPT, P0_PLUS_QUALITY_DOMAIN_KNOWLEDGE, P0_PLUS_STRICT_BANS } from "@/lib/p0-plus/prompts";
import { injectionMoldingFlashFixture } from "@/lib/p0-plus/__fixtures__/injection-molding-flash";
import { scarUnclearRolesFixture } from "@/lib/p0-plus/__fixtures__/scar-unclear-roles";
import { smtPcbaSolderDefectFixture } from "@/lib/p0-plus/__fixtures__/smt-pcba-solder-defect";

const fixtures = [injectionMoldingFlashFixture, smtPcbaSolderDefectFixture, scarUnclearRolesFixture];

function assertValidFixture(fixture: { name: string; response: P0PlusPreviewResponse }) {
  const result = validateP0PlusPreviewResponse(fixture.response);
  assert.equal(result.success, true, `${fixture.name} should satisfy P0+ schema: ${result.issues.join("; ")}`);
}

function actionTypes(response: P0PlusPreviewResponse) {
  return new Set(response.next_actions.map((action) => action.actionType));
}

function assertHasActions(response: P0PlusPreviewResponse, expected: P0PlusNextActionType[]) {
  const actual = actionTypes(response);
  for (const actionType of expected) {
    assert.equal(actual.has(actionType), true, `Expected next action ${actionType}`);
  }
}

function assertSectionCoverage(response: P0PlusPreviewResponse) {
  const actual = new Set(response.readiness_check.section_checks.map((check) => `${check.stepId}:${check.checkType}`));
  for (const required of P0_PLUS_REQUIRED_SECTION_CHECKS) {
    const key = `${required.stepId}:${required.checkType}`;
    assert.equal(actual.has(key), true, `Missing readiness section check ${key}`);
  }
}

function assertNextActionShape(response: P0PlusPreviewResponse) {
  for (const action of response.next_actions) {
    assert.ok(action.reason.trim(), `${action.actionType} should include reason`);
    assert.ok(action.suggestedOwner, `${action.actionType} should include suggested owner`);
    assert.ok(action.linkedStepId, `${action.actionType} should include linked D step`);
    assert.ok(action.priority, `${action.actionType} should include priority`);
    assert.ok(action.sourceStatus, `${action.actionType} should include source status`);
  }
}

for (const fixture of fixtures) {
  assertValidFixture(fixture);
  assertSectionCoverage(fixture.response);
  assertNextActionShape(fixture.response);
}

assert.deepEqual(
  [...P0_PLUS_SOURCE_STATUSES],
  ["provided", "extracted", "inferred", "missing", "needs_confirmation", "conflicting", "not_applicable"],
  "Source statuses must match the PR1 contract",
);

assertHasActions(injectionMoldingFlashFixture.response, [
  "confirm_lot_or_batch",
  "collect_inspection_data",
  "add_defect_evidence",
  "request_supplier_root_cause",
]);
assert.equal(injectionMoldingFlashFixture.response.draft.D2.batchNumber.sourceStatus, "needs_confirmation");
assert.equal(injectionMoldingFlashFixture.response.draft.D2.defectQuantity.sourceStatus, "missing");
assert.equal(injectionMoldingFlashFixture.response.conversion.reportDataPatch.batchNumber, "");
assert.equal(injectionMoldingFlashFixture.response.conversion.reportDataPatch.defectQuantity, "");

assertHasActions(smtPcbaSolderDefectFixture.response, [
  "collect_inspection_data",
  "add_measurement_vs_spec",
  "add_verification_evidence",
]);
assert.equal(smtPcbaSolderDefectFixture.response.draft.D4.rootCauseOccurrence.sourceStatus, "missing");
assert.equal(smtPcbaSolderDefectFixture.response.draft.D4.rootCauseEscape.sourceStatus, "missing");
assert.match(
  smtPcbaSolderDefectFixture.response.next_actions.map((action) => action.detail).join("\n"),
  /5Why[\s\S]*reflow profile[\s\S]*solder paste[\s\S]*stencil[\s\S]*inspection escape/i,
);

const scarQuestions = scarUnclearRolesFixture.response.inputSummary.clarificationQuestions.map((item) => item.question);
assert.deepEqual(scarQuestions, [
  "Which company is your company?",
  "Which company is the customer?",
  "Which company is the supplier?",
  "Who requested the 8D/SCAR?",
  "What is the submission deadline?",
]);
assert.equal(scarUnclearRolesFixture.response.draft.D0.customerName.value, "");
assert.equal(scarUnclearRolesFixture.response.draft.D0.customerName.sourceStatus, "needs_confirmation");
assert.equal(scarUnclearRolesFixture.response.conversion.reportDataPatch.customerName, "");
assert.equal(
  scarUnclearRolesFixture.response.next_actions.some((action) => action.actionType === "clarify_customer_supplier_roles"),
  true,
);

const unsafeMapperFixture: P0PlusPreviewResponse = {
  ...injectionMoldingFlashFixture.response,
  conversion: {
    ...injectionMoldingFlashFixture.response.conversion,
    reportDataPatch: {
      ...injectionMoldingFlashFixture.response.conversion.reportDataPatch,
      preparedSignatureUrl: "/api/attachments/private-signature/file",
      approverName: "Unverified Approver",
      privateUserId: "user_123",
    },
  },
};
const mapped = mapP0PlusPreviewToReportDataPatch(unsafeMapperFixture);
assert.deepEqual(
  mapped.patch,
  {
    problemSource: "production line",
    problemDescription:
      "Production line found flash/excess material on an injection molded part. Supplier and photos are mentioned, but lot and quantity are not confirmed.",
    whereFound: "production line",
    productName: "injection molded part",
  },
  "Mapper should only carry verified provided/extracted safe fields",
);
assert.deepEqual(
  mapped.issues.map((issue) => `${issue.field}:${issue.reason}`).sort(),
  [
    "approverName:unsafe_report_data_key",
    "batchNumber:unverified_source_status",
    "defectQuantity:unverified_source_status",
    "preparedSignatureUrl:unsafe_report_data_key",
    "privateUserId:unknown_report_data_key",
  ],
  "Mapper should reject unknown, unsafe, and unverified fields",
);

for (const knowledgeTerm of P0_PLUS_QUALITY_DOMAIN_KNOWLEDGE) {
  assert.match(P0_PLUS_AI_CONTRACT_PROMPT, new RegExp(knowledgeTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
}

for (const ban of P0_PLUS_STRICT_BANS) {
  assert.equal(P0_PLUS_AI_CONTRACT_PROMPT.includes(ban), true, `Prompt should include ban: ${ban}`);
}

assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not invent batch or lot numbers/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not invent defect quantities/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not invent measurements or drawing specifications/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not invent root cause/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not invent corrective action/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not approve the report/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /Do not certify or prove compliance/i);
assert.match(P0_PLUS_AI_CONTRACT_PROMPT, /must not use private knowledge context, historical reports, or team data/i);
