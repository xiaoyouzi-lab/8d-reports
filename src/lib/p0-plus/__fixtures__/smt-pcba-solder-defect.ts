import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import { baseDraft, evidence, field, nextAction, requiredEvidence, sectionChecks } from "./helpers";

const draft = baseDraft();

draft.reportType = field("customer_8d", "inferred", "Customer-facing format is assumed until confirmed.");
draft.priority = field("high", "inferred", "Solder defects can affect electrical function, but customer impact is not fully confirmed.");
draft.D2.problemDescription = field(
  "Preliminary inspection found SMT/PCBA solder joint defects including insufficient solder and bridging.",
  "extracted",
  "The defect symptom and preliminary inspection signal are extracted from the submitted material.",
  "high",
);
draft.D2.whereFound = field("inspection", "extracted", "Preliminary inspection data is mentioned.", "medium");
draft.D2.productName = field("PCBA", "extracted", "The process and assembly type indicate PCBA.", "medium");
draft.D2.defectQuantity = field("preliminary inspection data available", "extracted", "Inspection data exists, but exact counts need confirmation.", "medium");
draft.D4.rootCauseOccurrence = field("", "missing", "No occurrence root cause is confirmed.");
draft.D4.rootCauseEscape = field("", "missing", "No escape root cause is confirmed.");
draft.D4.why1 = field("", "missing", "5Why logic is not provided.");
draft.D4.why2 = field("", "missing", "5Why logic is not provided.");
draft.D5.selectedCorrectiveAction = field("", "missing", "Corrective action must trace to a confirmed root cause.");
draft.D6.validationMethod = field("", "missing", "No verification method is provided.");
draft.D7.processUpdates = field("", "missing", "No prevention or control plan update is provided.");

const next_actions = [
  nextAction({
    actionType: "collect_inspection_data",
    title: "Complete solder defect investigation",
    detail:
      "Add 5Why, process parameters, reflow profile, solder paste lot, stencil condition, SPI/AOI results, and inspection escape investigation.",
    suggestedOwner: "quality",
    priority: "high",
    linkedStepId: "D4",
    sourceStatus: "missing",
  }),
  nextAction({
    actionType: "add_measurement_vs_spec",
    title: "Add measurement versus specification",
    detail: "Record solder joint criteria, IPC/customer requirement, defect counts, and evidence images.",
    suggestedOwner: "inspection",
    priority: "high",
    linkedStepId: "D2",
    sourceStatus: "needs_confirmation",
  }),
  nextAction({
    actionType: "add_verification_evidence",
    title: "Define verification evidence",
    detail: "After root cause and action are selected, add validation lot size, retest method, and acceptance criteria.",
    suggestedOwner: "quality",
    priority: "medium",
    linkedStepId: "D6",
    sourceStatus: "missing",
  }),
];

export const smtPcbaSolderDefectFixture = {
  name: "smt-pcba-solder-defect",
  rawInput:
    "SMT line reported PCBA solder joint defects: insufficient solder and some bridging. Preliminary inspection data exists, but root cause is not known yet.",
  response: {
    schemaVersion: "p0-plus-preview-v1",
    generatedAt: "2026-07-03T00:00:00.000Z",
    modelTask: "p0_plus_draft_and_readiness",
    inputSummary: {
      sourceType: "inspection_summary",
      caseSummary: "SMT/PCBA solder joint defects were found, with preliminary inspection data but no root cause.",
      knownFacts: [
        evidence("D2", "Defect symptom", "Insufficient solder and bridging are defect symptoms.", "extracted"),
        evidence("D2", "Inspection data", "Preliminary inspection data exists.", "provided"),
      ],
      assumptions: [],
      conflicts: [],
      clarificationQuestions: [
        {
          question: "What are the exact defect counts and inspection criteria?",
          reason: "The input says inspection data exists but does not provide count or specification details.",
          linkedStepId: "D2",
          sourceStatus: "needs_confirmation",
        },
      ],
    },
    draft,
    readiness_check: {
      overall_risk: "high",
      score: 36,
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
        evidence("D4", "No root cause", "Root cause is not confirmed and must not be invented.", "missing", "blocker"),
      ],
      missing_evidence: [
        evidence("D4", "Occurrence cause", "Process cause is pending investigation.", "missing", "blocker"),
        evidence("D4", "Escape cause", "Inspection escape path is pending investigation.", "missing", "blocker"),
      ],
      recommended_fixes: [
        evidence("D4", "Separate symptom from cause", "Keep solder defect symptoms separate from occurrence and escape causes.", "missing"),
      ],
      next_actions,
    },
    missingInformation: [
      evidence("D4", "5Why", "5Why chain is missing.", "missing"),
      evidence("D4", "Process parameters", "Reflow, paste, stencil, and inspection escape evidence is missing.", "missing"),
    ],
    requiredEvidence: [
      requiredEvidence("D4", "Root cause investigation", ["5Why", "Reflow profile", "Solder paste lot", "Stencil condition"]),
      requiredEvidence("D6", "Verification evidence", ["Retest quantity", "Acceptance criteria", "Before/after defect rate"]),
    ],
    next_actions,
    conversion: {
      recommendedReportTitle: "SMT/PCBA solder joint defect",
      reportDataPatch: {
        problemDescription:
          "Preliminary inspection found SMT/PCBA solder joint defects including insufficient solder and bridging.",
        whereFound: "inspection",
        productName: "PCBA",
      },
      fieldsToLeaveBlank: ["rootCauseOccurrence", "rootCauseEscape", "confirmedRootCause", "selectedCorrectiveAction"],
    },
  } satisfies P0PlusPreviewResponse,
};
