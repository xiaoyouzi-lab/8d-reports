import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import { baseDraft, evidence, field, nextAction, requiredEvidence, sectionChecks } from "./helpers";

const draft = baseDraft();

draft.reportType = field("customer_8d", "needs_confirmation", "The email mentions SCAR/8D, but requester and role mapping are unclear.");
draft.priority = field("medium", "needs_confirmation", "Deadline may exist in the email, but it needs confirmation.");
draft.D0.problemSource = field("SCAR/8D email request", "extracted", "The pasted email requests a SCAR/8D response.", "high");
draft.D0.customerName = field("", "needs_confirmation", "Multiple companies appear in the email; customer role is unclear.");
draft.D1.teamLeader = field("", "needs_confirmation", "Responsible internal owner is not clear from the email.");
draft.D2.problemDescription = field(
  "Pasted customer/supplier email requests SCAR/8D response, but company roles and submission deadline need confirmation before drafting.",
  "extracted",
  "The request type is extracted, while roles are not confirmed.",
  "medium",
);
draft.D2.whoFound = field("", "needs_confirmation", "Requester identity and role are unclear.");
draft.D3.containmentDescription = field("", "missing", "No containment action is provided in the role-unclear email.");
draft.D4.rootCauseOccurrence = field("", "missing", "No root cause is provided.");
draft.D4.rootCauseEscape = field("", "missing", "No escape cause is provided.");

const clarificationQuestions = [
  "Which company is your company?",
  "Which company is the customer?",
  "Which company is the supplier?",
  "Who requested the 8D/SCAR?",
  "What is the submission deadline?",
].map((question) => ({
  question,
  reason: "The pasted email contains multiple companies or people and the role mapping is unclear.",
  linkedStepId: "D0" as const,
  sourceStatus: "needs_confirmation" as const,
}));

const next_actions = [
  nextAction({
    actionType: "clarify_customer_supplier_roles",
    title: "Clarify customer, supplier, and requester roles",
    detail: "Confirm our company, customer, supplier, requester, owner, and submission deadline before filling D0/D2.",
    suggestedOwner: "quality",
    priority: "high",
    linkedStepId: "D0",
    sourceStatus: "needs_confirmation",
  }),
  nextAction({
    actionType: "review_before_customer_submission",
    title: "Review before customer submission",
    detail: "Do not submit until roles, deadline, defect scope, containment, and evidence are confirmed.",
    suggestedOwner: "quality",
    priority: "high",
    linkedStepId: "D8",
    sourceStatus: "needs_confirmation",
  }),
];

export const scarUnclearRolesFixture = {
  name: "scar-unclear-roles",
  rawInput:
    "Email thread: ACME asks Beta and Chen to provide SCAR/8D by Friday. Supplier Quality and purchasing are copied, but it is unclear which company is ours, who is the customer, and who is the supplier.",
  response: {
    schemaVersion: "p0-plus-preview-v1",
    generatedAt: "2026-07-03T00:00:00.000Z",
    modelTask: "p0_plus_draft_and_readiness",
    inputSummary: {
      sourceType: "customer_complaint",
      caseSummary: "A pasted email appears to request SCAR/8D, but customer/supplier/company roles are unclear.",
      knownFacts: [evidence("D0", "SCAR/8D request", "The email requests a SCAR/8D response.", "extracted")],
      assumptions: [],
      conflicts: [],
      clarificationQuestions,
    },
    draft,
    readiness_check: {
      overall_risk: "high",
      score: 18,
      canStartAuthenticatedEdit: true,
      section_checks: sectionChecks({
        "D2:problem_clarity": "needs_confirmation",
        "D3:containment_completeness": "missing",
        "D4:occurrence_cause": "missing",
        "D4:escape_cause": "missing",
        "D4:five_why_logic": "missing",
        "D5:corrective_action_traceability": "missing",
        "D6:verification_evidence": "missing",
        "D7:prevention_quality": "missing",
        "D8:owner_date_evidence_completeness": "needs_confirmation",
      }),
      customer_submission_risks: [
        evidence("D0", "Role ambiguity", "Customer/supplier roles are unclear and must not be guessed.", "needs_confirmation", "blocker"),
      ],
      missing_evidence: [
        evidence("D2", "Defect scope", "The defect, product, lot, and quantity are not clear.", "missing", "blocker"),
      ],
      recommended_fixes: [
        evidence("D0", "Clarify roles", "Confirm company roles before filling customer or supplier fields.", "needs_confirmation"),
      ],
      next_actions,
    },
    missingInformation: [
      evidence("D0", "Our company", "The user's company is not clear.", "needs_confirmation"),
      evidence("D0", "Customer", "The customer is not clear.", "needs_confirmation"),
      evidence("D0", "Supplier", "The supplier is not clear.", "needs_confirmation"),
      evidence("D8", "Deadline", "Submission deadline needs confirmation.", "needs_confirmation"),
    ],
    requiredEvidence: [
      requiredEvidence("D0", "Role confirmation", ["Our company", "Customer", "Supplier", "Requester"]),
      requiredEvidence("D8", "Submission deadline", ["Customer request date", "Required response date"]),
    ],
    next_actions,
    conversion: {
      recommendedReportTitle: "SCAR/8D request with unclear roles",
      reportDataPatch: {
        problemSource: "SCAR/8D email request",
        problemDescription:
          "Pasted email requests SCAR/8D response, but customer, supplier, requester, and deadline require confirmation.",
        customerName: "",
      },
      fieldsToLeaveBlank: ["customerName", "teamLeader", "containmentDescription", "rootCauseOccurrence"],
    },
  } satisfies P0PlusPreviewResponse,
};
