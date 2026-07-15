import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildCustomerReviewSnapshot,
  normalizeCustomerFieldComments,
  parseCustomerReviewSnapshot,
  type CustomerFeedback,
} from "@/lib/quality-cases/customer-review";
import { validateQualityCaseAction } from "@/lib/quality-cases/contract";
import { projectQualityCaseForExternalTask } from "@/lib/quality-cases/external-projection";
import { buildExternalCaseDataUpdate } from "@/lib/quality-cases/external-tasks";
import {
  createQualityCaseTaskToken,
  hashQualityCaseTaskToken,
  isActiveQualityCaseTaskLink,
} from "@/lib/quality-cases/task-tokens";

const NOW = new Date("2026-07-11T08:00:00.000Z");

const snapshotResult = buildCustomerReviewSnapshot({
  caseVersion: 8,
  product: "A123 Controller",
  supplier: { name: "Li Wei", organization: "Shenzhen Supplier Co." },
  submissionDate: "2026-07-10T06:00:00.000Z",
  legacySections: [
    {
      fieldPath: "complaint_summary",
      label: "Complaint summary",
      text: "Three units failed during incoming inspection.",
    },
    {
      fieldPath: "containment",
      label: "Containment",
      text: "The affected lot was quarantined and shipment was stopped.",
    },
  ],
  mappings: [
    {
      mappingId: "mapping-root",
      decision: "confirmed",
      confirmationId: "confirmation-root",
      sourceType: "human_confirmation",
      semanticKey: "occurrence_analysis",
      confirmedText:
        "The fixture allowed reverse installation because orientation was not keyed.",
      language: "en",
      approvedEvidenceIds: ["evidence-1"],
    },
    {
      mappingId: "mapping-action",
      decision: "confirmed",
      confirmationId: "confirmation-action",
      sourceType: "human_confirmation",
      semanticKey: "corrective_action",
      confirmedText:
        "A keyed fixture and barcode interlock were introduced.",
      language: "en",
      approvedEvidenceIds: ["evidence-1"],
    },
    {
      mappingId: "mapping-ai",
      decision: "proposed",
      confirmationId: null,
      sourceType: "ai_suggestion",
      semanticKey: "escape_analysis",
      confirmedText: "AI speculation must never be visible to the customer.",
      language: "en",
      approvedEvidenceIds: ["evidence-2"],
    },
  ],
  evidence: [
    {
      id: "evidence-1",
      filename: "fixture-validation.pdf",
      mimeType: "application/pdf",
      fileSize: 4096,
      createdAt: "2026-07-10T07:00:00.000Z",
    },
    {
      id: "evidence-2",
      filename: "internal-unapproved.pdf",
      mimeType: "application/pdf",
      fileSize: 2048,
      createdAt: "2026-07-10T07:30:00.000Z",
    },
  ],
  now: NOW,
});

if (!snapshotResult.ok) throw new Error(snapshotResult.error);
assert.equal(snapshotResult.ok, true);
const snapshot = snapshotResult.value;

// Case 1: the customer projection contains only human-confirmed English
// sections and explicitly authorized evidence.
assert.equal(snapshot.caseVersion, 8);
assert.deepEqual(snapshot.fieldPaths, [
  "complaint_summary",
  "containment",
  "occurrence_analysis",
  "corrective_action",
]);
assert.match(snapshot.text, /keyed fixture and barcode interlock/i);
assert.deepEqual(snapshot.evidence.map((file) => file.id), ["evidence-1"]);
assert.doesNotMatch(snapshot.text, /AI speculation/);
assert.equal(JSON.stringify(snapshot).includes("internal-unapproved.pdf"), false);

// Case 2: parser allowlisting discards injected AI insights, supplier raw
// answers, internal notes, and unrelated organization data.
const parsed = parseCustomerReviewSnapshot({
  ...snapshot,
  aiInsights: [{ message: "internal logic risk" }],
  supplierRawAnswers: ["operator error"],
  internalNotes: "commercial terms",
  otherOrganizationData: "not authorized",
});
assert.ok(parsed);
const parsedText = JSON.stringify(parsed);
for (const forbidden of [
  "internal logic risk",
  "operator error",
  "commercial terms",
  "not authorized",
]) {
  assert.equal(parsedText.includes(forbidden), false);
}
const legacySnapshot = parseCustomerReviewSnapshot({
  text: "Complaint summary\nLegacy confirmed issue.\n\nCorrective action\nLegacy confirmed action.",
  fieldPaths: ["complaint_summary", "corrective_action"],
  complaintSummary: "Legacy confirmed issue.",
});
assert.deepEqual(
  legacySnapshot?.sections.map((section) => section.fieldPath),
  ["complaint_summary", "corrective_action"],
  "active customer links created before PR-G6 must remain readable",
);

// Case 3: customer acceptance reaches Customer Accepted and never Closed.
const accepted = validateQualityCaseAction("customer_review", {
  action: "customer_accept",
  actorRole: "external_guest",
});
assert.equal(accepted.ok, true);
if (accepted.ok) {
  assert.equal(accepted.transition.to, "customer_accepted");
  assert.notEqual(accepted.transition.to, "closed");
  assert.equal(accepted.transition.waitingOn, "internal");
}

// Cases 4 and 5: field comments are scoped to authorized sections and the
// Customer Feedback retains actor, organization, time, field, comment, and
// Case version in the append-only response history.
const fieldComments = normalizeCustomerFieldComments(
  [
    { fieldPath: "occurrence_analysis", comment: "Root cause is not convincing." },
    { fieldPath: "effectiveness_verification", comment: "Not authorized." },
    { fieldPath: "corrective_action", comment: "Please clarify the owner and due date." },
  ],
  snapshot.fieldPaths,
);
assert.deepEqual(fieldComments, [
  {
    fieldPath: "occurrence_analysis",
    comment: "Root cause is not convincing.",
  },
  {
    fieldPath: "corrective_action",
    comment: "Please clarify the owner and due date.",
  },
]);
const requested = validateQualityCaseAction("customer_review", {
  action: "request_customer_changes",
  actorRole: "external_guest",
  comment: "Two sections require clarification.",
  requestedFieldIds: fieldComments.map((item) => item.fieldPath),
});
assert.equal(requested.ok, true);
if (requested.ok) {
  assert.equal(requested.transition.to, "changes_requested_by_customer");
  assert.equal(requested.transition.waitingOn, "internal");
}
const feedback: CustomerFeedback = {
  id: "feedback-1",
  taskId: "task-1",
  caseVersion: 9,
  customer: {
    participantId: "customer-1",
    name: "Anna Schmidt",
    organization: "ABC GmbH",
  },
  submittedAt: NOW.toISOString(),
  fieldComments,
};
const changedCase = buildExternalCaseDataUpdate({
  previousCaseData: {},
  taskType: "customer_review",
  action: "request_customer_changes",
  response: "",
  comment: "Two sections require clarification.",
  requestedFieldIds: fieldComments.map((item) => item.fieldPath),
  now: NOW,
  customerFeedback: feedback,
});
const customerResponse = (
  changedCase.caseData as {
    customerResponse: { changeRequests: Array<Record<string, unknown>> };
  }
).customerResponse;
assert.equal(customerResponse.changeRequests.length, 1);
assert.deepEqual(customerResponse.changeRequests[0].fieldComments, fieldComments);
assert.deepEqual(customerResponse.changeRequests[0].customer, feedback.customer);
assert.equal(customerResponse.changeRequests[0].caseVersion, 9);
assert.equal(customerResponse.changeRequests[0].feedbackId, "feedback-1");

// Cases 6 and 7: task tokens are opaque, hashed, Case-scoped by the task row,
// and rejected when expired, revoked, or completed.
const token = createQualityCaseTaskToken();
assert.ok(token.length >= 40);
assert.match(hashQualityCaseTaskToken(token), /^[a-f0-9]{64}$/);
assert.notEqual(hashQualityCaseTaskToken(token), token);
assert.equal(
  isActiveQualityCaseTaskLink({
    expiresAt: new Date("2026-07-12T08:00:00.000Z"),
    revokedAt: null,
    completedAt: null,
    now: NOW,
  }),
  true,
);
assert.equal(
  isActiveQualityCaseTaskLink({
    expiresAt: new Date("2026-07-11T07:59:59.000Z"),
    revokedAt: null,
    completedAt: null,
    now: NOW,
  }),
  false,
);

const projection = projectQualityCaseForExternalTask("customer_review", {
  case_summary: { title: "Visible" },
  supplier_task: { rawAnswer: "forbidden" },
  supplier_evidence: [{ id: "forbidden" }],
  customer_response: snapshot,
  customer_evidence: snapshot.evidence,
  customer_comments: [],
});
assert.equal(JSON.stringify(projection).includes("rawAnswer"), false);
assert.deepEqual(projection.customer_evidence, snapshot.evidence);

const externalTaskSource = readFileSync(
  "src/lib/quality-cases/external-tasks.ts",
  "utf8",
);
assert.match(
  externalTaskSource,
  /\$\{qualityCases\}\.\$\{qualityCases\.id\}/,
  "Customer review transaction guards must qualify joined Case columns for PostgreSQL.",
);
const evidenceRouteSource = readFileSync(
  "src/app/api/quality-case-tasks/[token]/evidence/[evidenceId]/route.ts",
  "utf8",
);
const evidenceUploadRouteSource = readFileSync(
  "src/app/api/quality-case-tasks/[token]/evidence/route.ts",
  "utf8",
);
assert.match(externalTaskSource, /database\.batch\(\[/);
assert.match(externalTaskSource, /customerReviewVersion/);
assert.doesNotMatch(externalTaskSource, /action\s*===\s*["']close_case["']/);
assert.match(evidenceRouteSource, /getAuthorizedCustomerEvidence/);
assert.match(evidenceRouteSource, /Cache-Control["']:\s*["']private, no-store/);
assert.match(
  evidenceUploadRouteSource,
  /task\.taskType\s*!==\s*["']supplier_response["']/,
  "customer tokens must not upload files",
);

console.log("Customer Review Workspace tests passed.");
