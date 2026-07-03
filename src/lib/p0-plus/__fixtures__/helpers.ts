import {
  P0_PLUS_DRAFT_FIELD_NAMES,
  P0_PLUS_REQUIRED_SECTION_CHECKS,
  type P0PlusEvidenceItem,
  type P0PlusField,
  type P0PlusNextAction,
  type P0PlusPreviewResponse,
  type P0PlusReadinessStatus,
  type P0PlusRequiredEvidence,
  type P0PlusRiskLevel,
  type P0PlusSourceStatus,
} from "@/lib/p0-plus/schema";

export function field<T extends string>(
  value: T,
  sourceStatus: P0PlusSourceStatus,
  rationale = "No relevant data in the submitted material.",
  confidence: P0PlusField["confidence"] = "low",
): P0PlusField<T> {
  return { value, sourceStatus, rationale, confidence };
}

function blankStep<T extends readonly string[]>(fieldNames: T) {
  return Object.fromEntries(fieldNames.map((name) => [name, field("", "missing")])) as Record<T[number], P0PlusField>;
}

export function baseDraft(): P0PlusPreviewResponse["draft"] {
  return {
    reportType: field("customer_8d", "inferred", "Customer-facing workflow is assumed until confirmed.", "low"),
    priority: field("medium", "inferred", "Priority is estimated from limited context.", "low"),
    D0: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D0),
    D1: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D1),
    D2: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D2),
    D3: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D3),
    D4: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D4),
    D5: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D5),
    D6: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D6),
    D7: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D7),
    D8: blankStep(P0_PLUS_DRAFT_FIELD_NAMES.D8),
  };
}

export function evidence(
  stepId: P0PlusEvidenceItem["stepId"],
  label: string,
  detail: string,
  sourceStatus: P0PlusSourceStatus,
  severity: P0PlusEvidenceItem["severity"] = "warning",
): P0PlusEvidenceItem {
  return { stepId, label, detail, sourceStatus, severity };
}

export function requiredEvidence(
  stepId: P0PlusRequiredEvidence["stepId"],
  title: string,
  examples: string[],
): P0PlusRequiredEvidence {
  return {
    stepId,
    title,
    whyItMatters: "Customer-facing 8D content needs evidence before submission.",
    examples,
    priority: "required",
  };
}

export function sectionChecks(overrides: Partial<Record<string, P0PlusReadinessStatus>> = {}) {
  return P0_PLUS_REQUIRED_SECTION_CHECKS.map(({ stepId, checkType }) => {
    const key = `${stepId}:${checkType}`;
    const status = overrides[key] || "missing";
    const risk: P0PlusRiskLevel = status === "ready" ? "low" : status === "weak" ? "medium" : "high";
    return {
      stepId,
      checkType,
      status,
      finding: `${checkType} is ${status}.`,
      risk,
      recommended_fix: `Add objective evidence for ${checkType}.`,
      required_evidence: [`Evidence for ${checkType}`],
    };
  });
}

export function nextAction(
  action: Pick<
    P0PlusNextAction,
    "actionType" | "title" | "detail" | "suggestedOwner" | "priority" | "linkedStepId" | "sourceStatus"
  >,
): P0PlusNextAction {
  return {
    ...action,
    reason: `Needed to support ${action.linkedStepId} before customer submission.`,
  };
}
