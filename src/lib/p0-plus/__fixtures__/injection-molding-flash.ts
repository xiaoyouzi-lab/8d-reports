import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import { baseDraft, evidence, field, nextAction, requiredEvidence, sectionChecks } from "./helpers";

const draft = baseDraft();

draft.reportType = field("customer_8d", "inferred", "Supplier is mentioned, but customer-facing format still needs confirmation.");
draft.priority = field("medium", "inferred", "Priority cannot be verified without affected quantity or customer impact.");
draft.D0.problemSource = field("production line", "provided", "The line found the flash/excess material.");
draft.D0.customerName = field("", "missing", "No customer name is provided.");
draft.D2.problemDescription = field(
  "Production line found flash/excess material on an injection molded part. Supplier and photos are mentioned, but lot and quantity are not confirmed.",
  "extracted",
  "The symptom and process are extracted from the submitted production line description.",
  "high",
);
draft.D2.whereFound = field("production line", "provided", "The line location is directly stated.", "high");
draft.D2.productName = field("injection molded part", "extracted", "The part family is extracted from the process description.", "medium");
draft.D2.batchNumber = field("", "needs_confirmation", "Batch/lot is missing or uncertain.");
draft.D2.defectQuantity = field("", "missing", "Defect quantity is not provided.");
draft.D3.containmentDescription = field("", "missing", "No quarantine, sort, or containment action is provided.");
draft.D4.rootCauseOccurrence = field("", "missing", "No occurrence root cause is provided.");
draft.D4.rootCauseEscape = field("", "missing", "No escape root cause is provided.");
draft.D5.selectedCorrectiveAction = field("", "missing", "No corrective action is supported by evidence.");
draft.D6.validationResults = field("", "missing", "No verification result is provided.");
draft.D7.systemChanges = field("", "missing", "No prevention/system update is provided.");

const next_actions = [
  nextAction({
    actionType: "confirm_lot_or_batch",
    title: "Confirm affected lot or batch",
    detail: "Identify molding date, cavity, lot, supplier shipment, and any mixed stock boundaries.",
    suggestedOwner: "quality",
    priority: "high",
    linkedStepId: "D2",
    sourceStatus: "needs_confirmation",
  }),
  nextAction({
    actionType: "collect_inspection_data",
    title: "Count affected parts",
    detail: "Record inspected quantity, defect quantity, sampling method, and any PPM or AQL result.",
    suggestedOwner: "inspection",
    priority: "high",
    linkedStepId: "D2",
    sourceStatus: "missing",
  }),
  nextAction({
    actionType: "add_defect_evidence",
    title: "Attach defect photo evidence after login",
    detail: "Add photos showing flash location, scale, part number, and inspection criteria.",
    suggestedOwner: "quality",
    priority: "high",
    linkedStepId: "D2",
    sourceStatus: "extracted",
  }),
  nextAction({
    actionType: "request_supplier_root_cause",
    title: "Request supplier molding analysis",
    detail: "Ask supplier to analyze tooling wear, clamp force, venting, material condition, and process window.",
    suggestedOwner: "supplier",
    priority: "medium",
    linkedStepId: "D4",
    sourceStatus: "needs_confirmation",
  }),
];

export const injectionMoldingFlashFixture = {
  name: "injection-molding-flash",
  rawInput:
    "Production line found flash/excess material on an injection molded part. Supplier mentioned. Photos are available, but lot is not clear and defect quantity is not counted yet.",
  response: {
    schemaVersion: "p0-plus-preview-v1",
    generatedAt: "2026-07-03T00:00:00.000Z",
    modelTask: "p0_plus_draft_and_readiness",
    inputSummary: {
      sourceType: "line_feedback",
      caseSummary: "Injection molded part has flash/excess material found on the production line.",
      knownFacts: [
        evidence("D2", "Defect symptom", "Flash/excess material was found on an injection molded part.", "extracted"),
        evidence("D2", "Photos mentioned", "Photos are mentioned but not available to the preview model.", "extracted"),
      ],
      assumptions: [
        evidence("D4", "Supplier involvement", "Supplier analysis may be needed, but responsibility is not confirmed.", "inferred"),
      ],
      conflicts: [],
      clarificationQuestions: [
        {
          question: "Which lot or batch is affected?",
          reason: "The submitted material says the lot is unclear.",
          linkedStepId: "D2",
          sourceStatus: "needs_confirmation",
        },
      ],
    },
    draft,
    readiness_check: {
      overall_risk: "high",
      score: 28,
      canStartAuthenticatedEdit: true,
      section_checks: sectionChecks({
        "D2:problem_clarity": "weak",
        "D3:containment_completeness": "missing",
        "D4:occurrence_cause": "missing",
        "D4:escape_cause": "missing",
        "D4:five_why_logic": "missing",
        "D5:corrective_action_traceability": "missing",
        "D6:verification_evidence": "missing",
        "D7:prevention_quality": "missing",
        "D8:owner_date_evidence_completeness": "missing",
      }),
      customer_submission_risks: [
        evidence("D2", "Missing quantity and lot", "Customer may reject the report without scope and quantity.", "missing", "blocker"),
      ],
      missing_evidence: [
        evidence("D2", "Defect count", "Defect quantity and inspected quantity are missing.", "missing", "blocker"),
        evidence("D3", "Containment record", "No quarantine or sorting record is provided.", "missing", "blocker"),
      ],
      recommended_fixes: [
        evidence("D2", "Confirm scope", "Confirm batch, quantity, and photo evidence before drafting D4-D7.", "needs_confirmation"),
      ],
      next_actions,
    },
    missingInformation: [
      evidence("D2", "Lot/batch", "Affected lot or batch is missing or uncertain.", "needs_confirmation"),
      evidence("D2", "Defect quantity", "Defect quantity is missing.", "missing"),
    ],
    requiredEvidence: [
      requiredEvidence("D2", "Inspection count", ["Inspected quantity", "Defect quantity", "Sampling method"]),
      requiredEvidence("D3", "Containment record", ["Quarantine record", "Sort result", "Owner and date"]),
    ],
    next_actions,
    conversion: {
      recommendedReportTitle: "Injection molded part flash/excess material",
      reportDataPatch: {
        problemSource: "production line",
        problemDescription:
          "Production line found flash/excess material on an injection molded part. Supplier and photos are mentioned, but lot and quantity are not confirmed.",
        whereFound: "production line",
        productName: "injection molded part",
        batchNumber: "",
        defectQuantity: "",
      },
      fieldsToLeaveBlank: ["batchNumber", "defectQuantity", "containmentDescription", "rootCauseOccurrence"],
    },
  } satisfies P0PlusPreviewResponse,
};
