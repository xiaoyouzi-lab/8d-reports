import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateQualityCaseAction } from "@/lib/quality-cases/contract";
import {
  buildCustomerDraft,
  buildQualityReviewerPrompt,
  reviewSupplierResponsePackage,
  validateQualityReviewerResponse,
  type ConfirmedMappingSource,
} from "@/lib/quality-cases/internal-quality-review";
import type { SupplierResponsePackage } from "@/lib/quality-cases/supplier-response-package";

const NOW = new Date("2026-07-10T08:00:00.000Z");

function supplierPackage(input?: {
  occurrence?: string;
  corrective?: string;
  withVerificationEvidence?: boolean;
}): SupplierResponsePackage {
  const answers = [
    { id: "problem", stage: "problem_description", text: "客户在来料检验发现外壳装反 3 件。" },
    { id: "containment", stage: "containment", text: "已隔离同批库存并暂停出货。" },
    { id: "occurrence", stage: "occurrence_cause", text: input?.occurrence || "装配定位方向需要继续核实。" },
    { id: "escape", stage: "escape_cause", text: "现有抽检没有检查装配方向。" },
    { id: "action", stage: "corrective_action", text: input?.corrective || "增加定位治具并更新检查标准。" },
    { id: "verification", stage: "verification_and_prevention", text: "连续三个批次验证装配方向。" },
  ];
  const evidence = input?.withVerificationEvidence
    ? [
        {
          id: "evidence-verification",
          requirementIds: ["requirement-verification"],
          stage: "verification_and_prevention",
          relatedAnswerId: "verification",
          relatedInsightId: null,
          associations: [
            {
              requirementId: "requirement-verification",
              stage: "verification_and_prevention",
              relatedAnswerId: "verification",
              relatedInsightId: null,
            },
          ],
          uploaderParticipantId: "supplier-participant",
          filename: "three-lot-verification.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize: 4096,
          createdAt: NOW.toISOString(),
        },
      ]
    : [];
  return {
    schemaVersion: "supplier-response-package-v1",
    packageId: "package-1",
    caseContext: {
      caseId: "case-1",
      caseVersion: 3,
      taskId: "task-1",
      sessionId: "session-1",
      product: "A123 housing",
      problemSummary: "Housing assembled in the wrong orientation.",
      taskType: "supplier_response",
      taskStatus: "active",
      taskExpiresAt: "2026-07-20T08:00:00.000Z",
      dueAt: "2026-07-15T08:00:00.000Z",
    },
    investigation: {
      originalAnswers: answers.map((answer) => ({
        id: answer.id,
        answerGroupId: `group-${answer.id}`,
        revision: 1,
        supersedesAnswerId: null,
        questionId: `question-${answer.id}`,
        stage: answer.stage,
        category: answer.stage,
        text: answer.text,
        classification: "stated_fact",
        actorId: null,
        participantId: "supplier-participant",
        actorOrganization: "Shenzhen Supplier Co.",
        createdAt: NOW.toISOString(),
      })),
      currentAnswers: answers.map((answer) => ({
        answerGroupId: `group-${answer.id}`,
        answerId: answer.id,
        revision: 1,
        stage: answer.stage,
        text: answer.text,
      })),
      aiRuns: [],
      aiInterpretations: [],
      insights: [],
      missingInformation: [],
    },
    evidence: {
      requirements: [
        {
          id: "requirement-verification",
          requirement: "verification_result",
          reason: "需要记录证明措施是否有效。",
          status: evidence.length ? "satisfied" : "open",
          stage: "verification_and_prevention",
          relatedAnswerId: "verification",
          relatedInsightId: null,
          sourceAiRunId: null,
          evidenceIds: evidence.map((file) => file.id),
        },
      ],
      files: evidence,
      unlinkedEvidenceIds: [],
    },
    readiness: {
      advisoryOnly: true,
      doesNotBlockSubmission: true,
      problemDefinition: "complete",
      containment: "complete",
      rootCause: "needs_review",
      correctiveAction: "needs_review",
      verification: evidence.length ? "needs_review" : "missing_evidence",
      missingInformation: [],
      risks: [],
    },
    mappingSuggestions: [],
    supplier: {
      participantId: "supplier-participant",
      name: "Li Wei",
      organization: "Shenzhen Supplier Co.",
    },
    generatedAt: NOW.toISOString(),
  };
}

// Case 1: a direct cause must remain unconfirmed and lead to system/escape
// questions, never a declaration that operator error is the root cause.
const directCauseReview = reviewSupplierResponsePackage(
  supplierPackage({ occurrence: "员工操作错误，装反了。" }),
  NOW,
);
assert.equal(directCauseReview.advisoryOnly, true);
assert.equal(directCauseReview.mayTransitionCase, false);
assert.equal(
  directCauseReview.findings.find(
    (finding) => finding.id === "root-cause-direct-cause",
  )?.status,
  "needs_confirmation",
);
assert.equal(
  directCauseReview.suggestedQuestions.some((question) =>
    question.includes("为什么员工有机会做错"),
  ),
  true,
);
assert.equal(JSON.stringify(directCauseReview).includes("根因正确"), false);

// Case 2: training alone is called out as potentially insufficient.
const trainingReview = reviewSupplierResponsePackage(
  supplierPackage({ corrective: "加强培训并提醒员工注意。" }),
  NOW,
);
assert.equal(
  trainingReview.findings.find(
    (finding) => finding.id === "corrective-action-training-only",
  )?.status,
  "attention",
);
assert.equal(
  trainingReview.risks.some((risk) => risk.includes("短期措施")),
  true,
);

// Case 3: evidence associated with verification is detected, while its
// presence still does not prove that the action was effective.
const evidenceReview = reviewSupplierResponsePackage(
  supplierPackage({ withVerificationEvidence: true }),
  NOW,
);
const verificationFinding = evidenceReview.findings.find(
  (finding) => finding.id === "verification",
);
assert.equal(verificationFinding?.status, "complete");
assert.deepEqual(verificationFinding?.evidenceIds, ["evidence-verification"]);
assert.match(verificationFinding?.reason || "", /仍需人工确认/);

const confirmedMapping: ConfirmedMappingSource = {
  mappingId: "mapping-confirmed",
  decision: "confirmed",
  confirmationId: "confirmation-human",
  sourceType: "human_confirmation",
  semanticKey: "corrective_action",
  confirmedText:
    "A keyed fixture was introduced to prevent reverse installation.",
  language: "en",
  approvedEvidenceIds: ["evidence-verification"],
};

// Case 4: an AI proposal is not eligible for customer preparation until a
// human confirmation record exists.
const unconfirmedDraft = buildCustomerDraft({
  format: "english_email",
  caseTitle: "A123 reverse assembly",
  mappings: [
    {
      ...confirmedMapping,
      decision: "proposed",
      confirmationId: null,
      sourceType: "ai_suggestion",
    },
  ],
  evidence: supplierPackage({ withVerificationEvidence: true }).evidence.files,
});
assert.equal(unconfirmedDraft.ok, false);
const confirmedDraft = buildCustomerDraft({
  format: "english_email",
  caseTitle: "A123 reverse assembly",
  mappings: [confirmedMapping],
  evidence: supplierPackage({ withVerificationEvidence: true }).evidence.files,
});
assert.equal(confirmedDraft.ok, true);
if (confirmedDraft.ok) {
  assert.equal(confirmedDraft.value.isDraft, true);
  assert.equal(confirmedDraft.value.maySend, false);
  assert.match(confirmedDraft.value.draft, /keyed fixture/);
}

// Case 5: requesting an update is an explicit human workflow decision. The
// follow-up transition returns the Case to the supplier only through the
// existing state machine.
const requestChanges = validateQualityCaseAction("internal_review", {
  action: "request_supplier_changes",
  actorRole: "internal_member",
  comment: "请补充系统原因和验证记录。",
  requestedFieldIds: ["occurrence_analysis", "verification"],
  newDueAt: new Date("2026-07-15T08:00:00.000Z"),
});
assert.equal(requestChanges.ok, true);
if (requestChanges.ok) {
  assert.equal(requestChanges.transition.to, "changes_requested_from_supplier");
  assert.equal(requestChanges.transition.waitingOn, "supplier");
}
const sendFollowUp = validateQualityCaseAction(
  "changes_requested_from_supplier",
  {
    action: "send_to_supplier",
    actorRole: "internal_member",
    newDueAt: new Date("2026-07-15T08:00:00.000Z"),
  },
);
assert.equal(sendFollowUp.ok, true);
if (sendFollowUp.ok) {
  assert.equal(sendFollowUp.transition.to, "waiting_for_supplier");
  assert.equal(sendFollowUp.transition.waitingOn, "supplier");
}

// Case 6: customer drafts exclude unconfirmed AI speculation even when a
// forged caller labels its decision "confirmed".
const filteredDraft = buildCustomerDraft({
  format: "corrective_action_summary",
  caseTitle: "A123 reverse assembly",
  mappings: [
    confirmedMapping,
    {
      mappingId: "mapping-ai",
      decision: "confirmed",
      confirmationId: "not-a-human-confirmation",
      sourceType: "ai_suggestion",
      semanticKey: "occurrence_analysis",
      confirmedText: "The machine definitely caused the defect.",
      language: "en",
      approvedEvidenceIds: [],
    },
  ],
  evidence: supplierPackage({ withVerificationEvidence: true }).evidence.files,
});
assert.equal(filteredDraft.ok, true);
if (filteredDraft.ok) {
  assert.match(filteredDraft.value.draft, /keyed fixture/);
  assert.doesNotMatch(filteredDraft.value.draft, /machine definitely/i);
}

// The provider contract rejects approval/workflow fields and its prompt keeps
// the AI reviewer in a non-authoritative role.
const forbiddenProviderResponse = validateQualityReviewerResponse({
  schemaVersion: "quality-review-v1",
  confidence: "high",
  findings: [],
  risks: [],
  suggestedQuestions: [],
  recommendedNextAction: "accept_for_customer_preparation",
  confirmedRootCause: "operator error",
});
assert.equal(forbiddenProviderResponse.success, false);
const reviewerPrompt = buildQualityReviewerPrompt(supplierPackage());
assert.match(reviewerPrompt, /Never confirm a root cause/);
assert.match(reviewerPrompt, /transition\/close a Case/);

// Architectural regression guards: this service cannot write ReportData and
// mapping confirmation uses Neon's atomic non-interactive batch.
const serviceSource = readFileSync(
  "src/lib/quality-cases/internal-quality-review.ts",
  "utf8",
);
assert.doesNotMatch(
  serviceSource,
  /(?:insert|update|delete)\((?:reports|qualityCaseTexts)\)|from\(["'][^"']*reports/,
);
assert.doesNotMatch(serviceSource, /db\.transaction\(/);
assert.match(serviceSource, /db\.batch\(\[/);
assert.match(serviceSource, /canAssignExternalTasks/);

console.log("Internal Quality Review tests passed.");
