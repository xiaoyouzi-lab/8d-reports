import type { ReportData } from "@/lib/report-steps";

export const P0_PLUS_SOURCE_STATUSES = [
  "provided",
  "extracted",
  "inferred",
  "missing",
  "needs_confirmation",
  "conflicting",
  "not_applicable",
] as const;

export type P0PlusSourceStatus = (typeof P0_PLUS_SOURCE_STATUSES)[number];

export const P0_PLUS_READINESS_STATUSES = [
  "ready",
  "weak",
  "missing",
  "needs_confirmation",
  "not_applicable",
] as const;

export type P0PlusReadinessStatus = (typeof P0_PLUS_READINESS_STATUSES)[number];

export const P0_PLUS_RISK_LEVELS = ["low", "medium", "high"] as const;

export type P0PlusRiskLevel = (typeof P0_PLUS_RISK_LEVELS)[number];

export const P0_PLUS_STEP_IDS = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"] as const;

export type P0PlusStepId = (typeof P0_PLUS_STEP_IDS)[number];

export const P0_PLUS_NEXT_ACTION_TYPES = [
  "collect_inspection_data",
  "confirm_lot_or_batch",
  "confirm_part_or_supplier",
  "quarantine_or_sort_stock",
  "request_supplier_root_cause",
  "add_measurement_vs_spec",
  "add_defect_evidence",
  "add_containment_record",
  "add_verification_evidence",
  "clarify_customer_supplier_roles",
  "review_before_customer_submission",
  "login_to_edit",
  "export_after_review",
] as const;

export type P0PlusNextActionType = (typeof P0_PLUS_NEXT_ACTION_TYPES)[number];

export const P0_PLUS_SUGGESTED_OWNERS = [
  "quality",
  "inspection",
  "production",
  "supplier",
  "customer",
  "unknown",
] as const;

export type P0PlusSuggestedOwner = (typeof P0_PLUS_SUGGESTED_OWNERS)[number];

export const P0_PLUS_SECTION_CHECK_TYPES = [
  "problem_clarity",
  "containment_completeness",
  "occurrence_cause",
  "escape_cause",
  "five_why_logic",
  "corrective_action_traceability",
  "verification_evidence",
  "prevention_quality",
  "owner_date_evidence_completeness",
] as const;

export type P0PlusSectionCheckType = (typeof P0_PLUS_SECTION_CHECK_TYPES)[number];

export const P0_PLUS_REQUIRED_SECTION_CHECKS: ReadonlyArray<{
  stepId: Extract<P0PlusStepId, "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8">;
  checkType: P0PlusSectionCheckType;
}> = [
  { stepId: "D2", checkType: "problem_clarity" },
  { stepId: "D3", checkType: "containment_completeness" },
  { stepId: "D4", checkType: "occurrence_cause" },
  { stepId: "D4", checkType: "escape_cause" },
  { stepId: "D4", checkType: "five_why_logic" },
  { stepId: "D5", checkType: "corrective_action_traceability" },
  { stepId: "D6", checkType: "verification_evidence" },
  { stepId: "D7", checkType: "prevention_quality" },
  { stepId: "D8", checkType: "owner_date_evidence_completeness" },
];

export const P0_PLUS_DRAFT_FIELD_NAMES = {
  D0: ["problemSource", "customerName"],
  D1: ["teamLeader", "teamMembers"],
  D2: [
    "problemDescription",
    "whereFound",
    "whenFound",
    "whoFound",
    "productName",
    "batchNumber",
    "defectQuantity",
    "totalQuantity",
  ],
  D3: [
    "containmentDescription",
    "containmentScope",
    "containmentResponsible",
    "containmentDueDate",
    "containmentValidUntil",
    "containmentVerification",
  ],
  D4: [
    "rootCauseOccurrence",
    "rootCauseEscape",
    "rootCauseSystem",
    "fishboneMan",
    "fishboneMachine",
    "fishboneMaterial",
    "fishboneMethod",
    "fishboneMeasurement",
    "fishboneEnvironment",
    "why1",
    "why2",
    "why3",
    "why4",
    "why5",
    "confirmedRootCause",
  ],
  D5: [
    "testingPlan",
    "testingResults",
    "selectedCorrectiveAction",
    "correctiveRationale",
    "costEstimate",
    "correctiveResponsible",
    "correctiveTargetDate",
  ],
  D6: ["implementationPlan", "completionDate", "validationMethod", "validationResults"],
  D7: ["systemChanges", "processUpdates", "horizontalDeployment", "trainingNeeds"],
  D8: ["closureDate", "lessonsLearned", "teamAcknowledgment", "preparedBy", "reviewedBy", "approverName"],
} as const;

export type P0PlusDraftStepId = keyof typeof P0_PLUS_DRAFT_FIELD_NAMES;

export interface P0PlusField<T = string> {
  value: T;
  sourceStatus: P0PlusSourceStatus;
  rationale: string;
  sourceQuote?: string;
  confidence: "low" | "medium" | "high";
}

export interface P0PlusEvidenceItem {
  stepId?: P0PlusStepId;
  label: string;
  detail: string;
  sourceStatus: P0PlusSourceStatus;
  severity?: "info" | "warning" | "blocker";
}

export interface P0PlusRequiredEvidence {
  stepId: P0PlusStepId;
  title: string;
  whyItMatters: string;
  examples: string[];
  priority: "required" | "recommended" | "optional";
  relatedAttachmentRefs?: P0PlusAttachmentReference[];
}

export interface P0PlusAttachmentReference {
  attachmentRef: string;
  relationshipStatus: "mentioned_by_user" | "needs_upload_after_login" | "not_available";
  note: string;
}

export interface P0PlusClarificationQuestion {
  question: string;
  reason: string;
  linkedStepId: P0PlusStepId;
  sourceStatus: Extract<P0PlusSourceStatus, "needs_confirmation" | "missing" | "conflicting">;
}

export interface P0PlusSectionCheck {
  stepId: Extract<P0PlusStepId, "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8">;
  checkType: P0PlusSectionCheckType;
  status: P0PlusReadinessStatus;
  finding: string;
  risk: P0PlusRiskLevel;
  recommended_fix: string;
  required_evidence: string[];
}

export interface P0PlusNextAction {
  actionType: P0PlusNextActionType;
  title: string;
  detail: string;
  reason: string;
  suggestedOwner: P0PlusSuggestedOwner;
  priority: "high" | "medium" | "low";
  linkedStepId: P0PlusStepId;
  sourceStatus: P0PlusSourceStatus;
}

export interface P0PlusDraft {
  reportType: P0PlusField<"customer_8d" | "internal_8d">;
  priority: P0PlusField<"low" | "medium" | "high">;
  D0: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D0)[number], P0PlusField>;
  D1: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D1)[number], P0PlusField>;
  D2: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D2)[number], P0PlusField>;
  D3: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D3)[number], P0PlusField>;
  D4: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D4)[number], P0PlusField>;
  D5: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D5)[number], P0PlusField>;
  D6: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D6)[number], P0PlusField>;
  D7: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D7)[number], P0PlusField>;
  D8: Record<(typeof P0_PLUS_DRAFT_FIELD_NAMES.D8)[number], P0PlusField>;
}

export interface P0PlusPreviewResponse {
  schemaVersion: "p0-plus-preview-v1";
  generatedAt: string;
  modelTask: "p0_plus_draft_and_readiness";
  inputSummary: {
    sourceType:
      | "customer_complaint"
      | "line_feedback"
      | "inspection_summary"
      | "supplier_reply"
      | "mixed"
      | "unknown";
    caseSummary: string;
    knownFacts: P0PlusEvidenceItem[];
    assumptions: P0PlusEvidenceItem[];
    conflicts: P0PlusEvidenceItem[];
    clarificationQuestions: P0PlusClarificationQuestion[];
  };
  draft: P0PlusDraft;
  readiness_check: {
    overall_risk: P0PlusRiskLevel;
    score: number;
    canStartAuthenticatedEdit: boolean;
    section_checks: P0PlusSectionCheck[];
    customer_submission_risks: P0PlusEvidenceItem[];
    missing_evidence: P0PlusEvidenceItem[];
    recommended_fixes: P0PlusEvidenceItem[];
    next_actions: P0PlusNextAction[];
  };
  missingInformation: P0PlusEvidenceItem[];
  requiredEvidence: P0PlusRequiredEvidence[];
  next_actions: P0PlusNextAction[];
  conversion: {
    recommendedReportTitle: string;
    reportDataPatch: Partial<ReportData>;
    fieldsToLeaveBlank: Array<keyof ReportData>;
  };
}

export interface P0PlusValidationResult<T> {
  success: boolean;
  data?: T;
  issues: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown) {
  return typeof value === "string";
}

function isNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown) {
  return typeof value === "boolean";
}

function isEnumValue<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return isString(value) && values.includes(value);
}

function pushIssue(issues: string[], path: string, message: string) {
  issues.push(`${path}: ${message}`);
}

function validateEvidenceItem(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, path, "must be an object");
    return;
  }
  if (value.stepId !== undefined && !isEnumValue(value.stepId, P0_PLUS_STEP_IDS)) {
    pushIssue(issues, `${path}.stepId`, "must be a D0-D8 step id");
  }
  if (!isString(value.label)) pushIssue(issues, `${path}.label`, "must be a string");
  if (!isString(value.detail)) pushIssue(issues, `${path}.detail`, "must be a string");
  if (!isEnumValue(value.sourceStatus, P0_PLUS_SOURCE_STATUSES)) {
    pushIssue(issues, `${path}.sourceStatus`, "must be a valid source status");
  }
}

function validateEvidenceArray(value: unknown, path: string, issues: string[]) {
  if (!Array.isArray(value)) {
    pushIssue(issues, path, "must be an array");
    return;
  }
  value.forEach((item, index) => validateEvidenceItem(item, `${path}[${index}]`, issues));
}

function validateField(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, path, "must be an object");
    return;
  }
  if (value.value === undefined) pushIssue(issues, `${path}.value`, "is required");
  if (!isEnumValue(value.sourceStatus, P0_PLUS_SOURCE_STATUSES)) {
    pushIssue(issues, `${path}.sourceStatus`, "must be a valid source status");
  }
  if (!isString(value.rationale)) pushIssue(issues, `${path}.rationale`, "must be a string");
  if (!isEnumValue(value.confidence, ["low", "medium", "high"] as const)) {
    pushIssue(issues, `${path}.confidence`, "must be low, medium, or high");
  }
}

function validateDraft(value: unknown, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, "draft", "must be an object");
    return;
  }
  validateField(value.reportType, "draft.reportType", issues);
  validateField(value.priority, "draft.priority", issues);
  for (const [stepId, fields] of Object.entries(P0_PLUS_DRAFT_FIELD_NAMES) as Array<
    [P0PlusDraftStepId, readonly string[]]
  >) {
    const step = value[stepId];
    if (!isRecord(step)) {
      pushIssue(issues, `draft.${stepId}`, "must be an object");
      continue;
    }
    for (const fieldName of fields) {
      validateField(step[fieldName], `draft.${stepId}.${fieldName}`, issues);
    }
  }
}

function validateRequiredEvidence(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, path, "must be an object");
    return;
  }
  if (!isEnumValue(value.stepId, P0_PLUS_STEP_IDS)) pushIssue(issues, `${path}.stepId`, "must be a D0-D8 step id");
  if (!isString(value.title)) pushIssue(issues, `${path}.title`, "must be a string");
  if (!isString(value.whyItMatters)) pushIssue(issues, `${path}.whyItMatters`, "must be a string");
  if (!Array.isArray(value.examples) || !value.examples.every(isString)) {
    pushIssue(issues, `${path}.examples`, "must be an array of strings");
  }
  if (!isEnumValue(value.priority, ["required", "recommended", "optional"] as const)) {
    pushIssue(issues, `${path}.priority`, "must be required, recommended, or optional");
  }
}

function validateClarificationQuestion(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, path, "must be an object");
    return;
  }
  if (!isString(value.question)) pushIssue(issues, `${path}.question`, "must be a string");
  if (!isString(value.reason)) pushIssue(issues, `${path}.reason`, "must be a string");
  if (!isEnumValue(value.linkedStepId, P0_PLUS_STEP_IDS)) {
    pushIssue(issues, `${path}.linkedStepId`, "must be a D0-D8 step id");
  }
  if (!isEnumValue(value.sourceStatus, ["needs_confirmation", "missing", "conflicting"] as const)) {
    pushIssue(issues, `${path}.sourceStatus`, "must be needs_confirmation, missing, or conflicting");
  }
}

function validateSectionCheck(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, path, "must be an object");
    return;
  }
  if (!isEnumValue(value.stepId, ["D2", "D3", "D4", "D5", "D6", "D7", "D8"] as const)) {
    pushIssue(issues, `${path}.stepId`, "must be D2-D8");
  }
  if (!isEnumValue(value.checkType, P0_PLUS_SECTION_CHECK_TYPES)) {
    pushIssue(issues, `${path}.checkType`, "must be a required readiness check type");
  }
  if (!isEnumValue(value.status, P0_PLUS_READINESS_STATUSES)) {
    pushIssue(issues, `${path}.status`, "must be a valid readiness status");
  }
  if (!isString(value.finding)) pushIssue(issues, `${path}.finding`, "must be a string");
  if (!isEnumValue(value.risk, P0_PLUS_RISK_LEVELS)) pushIssue(issues, `${path}.risk`, "must be a risk level");
  if (!isString(value.recommended_fix)) pushIssue(issues, `${path}.recommended_fix`, "must be a string");
  if (!Array.isArray(value.required_evidence) || !value.required_evidence.every(isString)) {
    pushIssue(issues, `${path}.required_evidence`, "must be an array of strings");
  }
}

function validateNextAction(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    pushIssue(issues, path, "must be an object");
    return;
  }
  if (!isEnumValue(value.actionType, P0_PLUS_NEXT_ACTION_TYPES)) {
    pushIssue(issues, `${path}.actionType`, "must be a valid next action type");
  }
  if (!isString(value.title)) pushIssue(issues, `${path}.title`, "must be a string");
  if (!isString(value.detail)) pushIssue(issues, `${path}.detail`, "must be a string");
  if (!isString(value.reason)) pushIssue(issues, `${path}.reason`, "must be a string");
  if (!isEnumValue(value.suggestedOwner, P0_PLUS_SUGGESTED_OWNERS)) {
    pushIssue(issues, `${path}.suggestedOwner`, "must be a suggested owner");
  }
  if (!isEnumValue(value.priority, ["high", "medium", "low"] as const)) {
    pushIssue(issues, `${path}.priority`, "must be high, medium, or low");
  }
  if (!isEnumValue(value.linkedStepId, P0_PLUS_STEP_IDS)) {
    pushIssue(issues, `${path}.linkedStepId`, "must be a D0-D8 step id");
  }
  if (!isEnumValue(value.sourceStatus, P0_PLUS_SOURCE_STATUSES)) {
    pushIssue(issues, `${path}.sourceStatus`, "must be a valid source status");
  }
}

function validateRequiredSectionCoverage(sectionChecks: unknown, issues: string[]) {
  if (!Array.isArray(sectionChecks)) return;
  const actual = new Set(
    sectionChecks
      .filter(isRecord)
      .map((check) => `${String(check.stepId)}:${String(check.checkType)}`),
  );
  for (const required of P0_PLUS_REQUIRED_SECTION_CHECKS) {
    const key = `${required.stepId}:${required.checkType}`;
    if (!actual.has(key)) {
      pushIssue(issues, "readiness_check.section_checks", `missing required check ${key}`);
    }
  }
}

export function validateP0PlusPreviewResponse(value: unknown): P0PlusValidationResult<P0PlusPreviewResponse> {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return { success: false, issues: ["response: must be an object"] };
  }

  if (value.schemaVersion !== "p0-plus-preview-v1") {
    pushIssue(issues, "schemaVersion", "must be p0-plus-preview-v1");
  }
  if (!isString(value.generatedAt)) pushIssue(issues, "generatedAt", "must be a string");
  if (value.modelTask !== "p0_plus_draft_and_readiness") {
    pushIssue(issues, "modelTask", "must be p0_plus_draft_and_readiness");
  }

  if (!isRecord(value.inputSummary)) {
    pushIssue(issues, "inputSummary", "must be an object");
  } else {
    if (!isString(value.inputSummary.caseSummary)) {
      pushIssue(issues, "inputSummary.caseSummary", "must be a string");
    }
    validateEvidenceArray(value.inputSummary.knownFacts, "inputSummary.knownFacts", issues);
    validateEvidenceArray(value.inputSummary.assumptions, "inputSummary.assumptions", issues);
    validateEvidenceArray(value.inputSummary.conflicts, "inputSummary.conflicts", issues);
    if (!Array.isArray(value.inputSummary.clarificationQuestions)) {
      pushIssue(issues, "inputSummary.clarificationQuestions", "must be an array");
    } else {
      value.inputSummary.clarificationQuestions.forEach((question, index) =>
        validateClarificationQuestion(question, `inputSummary.clarificationQuestions[${index}]`, issues),
      );
    }
  }

  validateDraft(value.draft, issues);

  if (!isRecord(value.readiness_check)) {
    pushIssue(issues, "readiness_check", "must be an object");
  } else {
    if (!isEnumValue(value.readiness_check.overall_risk, P0_PLUS_RISK_LEVELS)) {
      pushIssue(issues, "readiness_check.overall_risk", "must be a risk level");
    }
    if (!isNumber(value.readiness_check.score)) pushIssue(issues, "readiness_check.score", "must be a number");
    if (!isBoolean(value.readiness_check.canStartAuthenticatedEdit)) {
      pushIssue(issues, "readiness_check.canStartAuthenticatedEdit", "must be a boolean");
    }
    if (!Array.isArray(value.readiness_check.section_checks)) {
      pushIssue(issues, "readiness_check.section_checks", "must be an array");
    } else {
      value.readiness_check.section_checks.forEach((check, index) =>
        validateSectionCheck(check, `readiness_check.section_checks[${index}]`, issues),
      );
      validateRequiredSectionCoverage(value.readiness_check.section_checks, issues);
    }
    validateEvidenceArray(value.readiness_check.customer_submission_risks, "readiness_check.customer_submission_risks", issues);
    validateEvidenceArray(value.readiness_check.missing_evidence, "readiness_check.missing_evidence", issues);
    validateEvidenceArray(value.readiness_check.recommended_fixes, "readiness_check.recommended_fixes", issues);
    if (!Array.isArray(value.readiness_check.next_actions)) {
      pushIssue(issues, "readiness_check.next_actions", "must be an array");
    } else {
      value.readiness_check.next_actions.forEach((action, index) =>
        validateNextAction(action, `readiness_check.next_actions[${index}]`, issues),
      );
    }
  }

  validateEvidenceArray(value.missingInformation, "missingInformation", issues);
  if (!Array.isArray(value.requiredEvidence)) {
    pushIssue(issues, "requiredEvidence", "must be an array");
  } else {
    value.requiredEvidence.forEach((evidence, index) =>
      validateRequiredEvidence(evidence, `requiredEvidence[${index}]`, issues),
    );
  }
  if (!Array.isArray(value.next_actions)) {
    pushIssue(issues, "next_actions", "must be an array");
  } else {
    value.next_actions.forEach((action, index) => validateNextAction(action, `next_actions[${index}]`, issues));
  }

  if (!isRecord(value.conversion)) {
    pushIssue(issues, "conversion", "must be an object");
  } else {
    if (!isString(value.conversion.recommendedReportTitle)) {
      pushIssue(issues, "conversion.recommendedReportTitle", "must be a string");
    }
    if (!isRecord(value.conversion.reportDataPatch)) {
      pushIssue(issues, "conversion.reportDataPatch", "must be an object");
    }
    if (!Array.isArray(value.conversion.fieldsToLeaveBlank)) {
      pushIssue(issues, "conversion.fieldsToLeaveBlank", "must be an array");
    }
  }

  return {
    success: issues.length === 0,
    data: issues.length === 0 ? (value as unknown as P0PlusPreviewResponse) : undefined,
    issues,
  };
}
