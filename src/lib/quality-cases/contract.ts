/**
 * Domain contract for the Quality Case collaboration workflow.
 *
 * This module is deliberately framework and database independent. It is the
 * single policy source for the later persistence, API, and UI layers, and it
 * must not be replaced by the legacy report workflow. Existing 8D reports are
 * output artifacts that a Quality Case may reference; they remain compatible.
 */

export const QUALITY_CASE_STATUSES = [
  "draft",
  "waiting_for_supplier",
  "supplier_submitted",
  "internal_review",
  "changes_requested_from_supplier",
  "ready_for_customer",
  "customer_review",
  "changes_requested_by_customer",
  "customer_accepted",
  "verification_planning",
  "verification_in_progress",
  "verification_submitted",
  "internal_verification_review",
  "verified_effective",
  /** Compatibility state used by pre-G7 cases. It cannot be closed directly. */
  "effectiveness_verification",
  "closed",
  "reopened",
] as const;

export type QualityCaseStatus = (typeof QUALITY_CASE_STATUSES)[number];

export const QUALITY_CASE_ACTOR_ROLES = [
  "customer",
  "coordinator",
  "supplier",
  "internal_member",
  "external_guest",
] as const;

export type QualityCaseActorRole = (typeof QUALITY_CASE_ACTOR_ROLES)[number];

export const QUALITY_CASE_ACTIONS = [
  "send_to_supplier",
  "supplier_submit",
  "start_internal_review",
  "request_supplier_changes",
  "mark_ready_for_customer",
  "send_to_customer_review",
  "request_customer_changes",
  "customer_accept",
  "start_effectiveness_verification",
  "begin_verification_planning",
  "start_verification_execution",
  "submit_verification",
  "start_verification_review",
  "approve_verification",
  "request_verification_evidence",
  "mark_verification_failed",
  "close_case",
  "reopen_case",
] as const;

export type QualityCaseAction = (typeof QUALITY_CASE_ACTIONS)[number];

export type QualityCaseWaitingOn = "internal" | "supplier" | "customer" | "none";

export type QualityCaseOutputType =
  | "8d"
  | "scar"
  | "car"
  | "capa"
  | "ncr_response"
  | "corrective_action_report";

export type QualityCaseTaskType = "supplier_response" | "customer_review" | "verification_response";

export type QualityCaseVisibleSection =
  | "case_summary"
  | "supplier_task"
  | "supplier_evidence"
  | "customer_response"
  | "customer_evidence"
  | "customer_comments"
  | "verification_plan"
  | "verification_execution"
  | "verification_result"
  | "verification_evidence";

export type InternalOnlyCaseSection =
  | "internal_notes"
  | "ai_risk_assessment"
  | "commercial_information"
  | "other_supplier_data";

export const INTERNAL_ONLY_CASE_SECTIONS: readonly InternalOnlyCaseSection[] = [
  "internal_notes",
  "ai_risk_assessment",
  "commercial_information",
  "other_supplier_data",
];

export interface BilingualText {
  /** Source supplied or confirmed by a human. Never overwrite it with AI. */
  original: { language: "en" | "zh-CN"; text: string };
  /** Untrusted convenience draft. It is never a final customer-facing output. */
  aiTranslation?: { language: "en" | "zh-CN"; text: string; generatedAt: string };
  /** Human-confirmed text used in an external response or export. */
  confirmedTranslation?: { language: "en" | "zh-CN"; text: string; confirmedAt: string; confirmedBy: string };
}

export interface QualityCaseActionInput {
  action: QualityCaseAction;
  actorRole: QualityCaseActorRole;
  comment?: string | null;
  requestedFieldIds?: string[];
  newDueAt?: Date | null;
  evidenceIds?: string[];
}

export interface QualityCaseTransition {
  from: QualityCaseStatus;
  action: QualityCaseAction;
  to: QualityCaseStatus;
  waitingOn: QualityCaseWaitingOn;
  nextAction: string;
  allowedActorRoles: readonly QualityCaseActorRole[];
  requiresComment?: boolean;
  requiresRequestedFields?: boolean;
  requiresDueDate?: boolean;
}

export interface QualityCaseActivityRecord {
  caseId: string;
  version: number;
  action: QualityCaseAction;
  actorId: string | null;
  actorOrganizationId: string | null;
  actorRole: QualityCaseActorRole;
  occurredAt: string;
  comment: string | null;
  requestedFieldIds: string[];
  requestedChanges: string | null;
  dueAt: string | null;
  diff: Record<string, { before: unknown; after: unknown }>;
  evidenceIds: string[];
}

const INTERNAL_ROLES = ["coordinator", "internal_member"] as const;

const TRANSITIONS: readonly QualityCaseTransition[] = [
  {
    from: "draft",
    action: "send_to_supplier",
    to: "waiting_for_supplier",
    waitingOn: "supplier",
    nextAction: "Supplier completes the assigned response and attaches evidence.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresDueDate: true,
  },
  {
    from: "draft",
    action: "start_internal_review",
    to: "internal_review",
    waitingOn: "internal",
    nextAction: "Internal team reviews the case before supplier assignment.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "waiting_for_supplier",
    action: "supplier_submit",
    to: "supplier_submitted",
    waitingOn: "internal",
    nextAction: "Internal team reviews the supplier response and evidence.",
    allowedActorRoles: ["supplier", "external_guest"],
  },
  {
    from: "supplier_submitted",
    action: "start_internal_review",
    to: "internal_review",
    waitingOn: "internal",
    nextAction: "Internal reviewer accepts the response or requests changes.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "internal_review",
    action: "request_supplier_changes",
    to: "changes_requested_from_supplier",
    waitingOn: "supplier",
    nextAction: "Supplier addresses the requested fields and resubmits evidence.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresComment: true,
    requiresRequestedFields: true,
    requiresDueDate: true,
  },
  {
    from: "internal_review",
    action: "mark_ready_for_customer",
    to: "ready_for_customer",
    waitingOn: "internal",
    nextAction: "Coordinator sends the approved response to the customer for review.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "changes_requested_from_supplier",
    action: "send_to_supplier",
    to: "waiting_for_supplier",
    waitingOn: "supplier",
    nextAction: "Supplier completes the revised response by the new due date.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresDueDate: true,
  },
  {
    from: "ready_for_customer",
    action: "send_to_customer_review",
    to: "customer_review",
    waitingOn: "customer",
    nextAction: "Customer reviews the authorized response or requests changes.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "customer_review",
    action: "request_customer_changes",
    to: "changes_requested_by_customer",
    waitingOn: "internal",
    nextAction: "Internal team triages the customer feedback and updates the response.",
    allowedActorRoles: ["customer", "external_guest"],
    requiresComment: true,
    requiresRequestedFields: true,
  },
  {
    from: "customer_review",
    action: "customer_accept",
    to: "customer_accepted",
    waitingOn: "internal",
    nextAction: "Internal team starts effectiveness verification; customer acceptance does not close the case.",
    allowedActorRoles: ["customer", "external_guest"],
  },
  {
    from: "changes_requested_by_customer",
    action: "start_internal_review",
    to: "internal_review",
    waitingOn: "internal",
    nextAction: "Internal team addresses customer feedback before another customer submission.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "customer_accepted",
    action: "start_effectiveness_verification",
    to: "verification_planning",
    waitingOn: "internal",
    nextAction: "Define a measurable plan for proving the corrective action remains effective.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "effectiveness_verification",
    action: "begin_verification_planning",
    to: "verification_planning",
    waitingOn: "internal",
    nextAction: "Migrate this legacy verification case into a measurable verification plan.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "verification_planning",
    action: "start_verification_execution",
    to: "verification_in_progress",
    waitingOn: "supplier",
    nextAction: "Execute the plan, record actual scope, and attach result evidence.",
    allowedActorRoles: ["coordinator", "internal_member", "supplier", "external_guest"],
  },
  {
    from: "verification_in_progress",
    action: "submit_verification",
    to: "verification_submitted",
    waitingOn: "internal",
    nextAction: "Internal reviewer checks the result against its acceptance criteria.",
    allowedActorRoles: ["coordinator", "internal_member", "supplier", "external_guest"],
  },
  {
    from: "verification_submitted",
    action: "start_verification_review",
    to: "internal_verification_review",
    waitingOn: "internal",
    nextAction: "An authorized human reviews the submitted result and evidence.",
    allowedActorRoles: INTERNAL_ROLES,
  },
  {
    from: "internal_verification_review",
    action: "approve_verification",
    to: "verified_effective",
    waitingOn: "internal",
    nextAction: "An authorized coordinator may formally close the verified case.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresComment: true,
  },
  {
    from: "internal_verification_review",
    action: "request_verification_evidence",
    to: "verification_in_progress",
    waitingOn: "supplier",
    nextAction: "Provide the requested evidence or execution detail and resubmit.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresComment: true,
  },
  {
    from: "internal_verification_review",
    action: "mark_verification_failed",
    to: "reopened",
    waitingOn: "internal",
    nextAction: "Start a new investigation cycle without overwriting this failed verification cycle.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresComment: true,
  },
  {
    from: "verified_effective",
    action: "close_case",
    to: "closed",
    waitingOn: "none",
    nextAction: "Case is closed. Reopen if later evidence shows the action was ineffective.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresComment: true,
  },
  {
    from: "closed",
    action: "reopen_case",
    to: "reopened",
    waitingOn: "internal",
    nextAction: "Internal team assesses the reopening reason and routes the case for review.",
    allowedActorRoles: INTERNAL_ROLES,
    requiresComment: true,
  },
  {
    from: "reopened",
    action: "start_internal_review",
    to: "internal_review",
    waitingOn: "internal",
    nextAction: "Internal team reassesses the corrective action and evidence.",
    allowedActorRoles: INTERNAL_ROLES,
  },
];

export function isQualityCaseStatus(value: unknown): value is QualityCaseStatus {
  return typeof value === "string" && (QUALITY_CASE_STATUSES as readonly string[]).includes(value);
}

export function getQualityCaseTransition(
  status: QualityCaseStatus,
  action: QualityCaseAction,
): QualityCaseTransition | null {
  return TRANSITIONS.find((transition) => transition.from === status && transition.action === action) || null;
}

export function validateQualityCaseAction(
  status: QualityCaseStatus,
  input: QualityCaseActionInput,
): { ok: true; transition: QualityCaseTransition } | { ok: false; error: string } {
  const transition = getQualityCaseTransition(status, input.action);
  if (!transition) return { ok: false, error: `Action ${input.action} is not available while case is ${status}.` };
  if (!transition.allowedActorRoles.includes(input.actorRole)) {
    return { ok: false, error: "This participant is not allowed to perform that action." };
  }
  if (transition.requiresComment && !input.comment?.trim()) {
    return { ok: false, error: "A comment is required for this action." };
  }
  if (transition.requiresRequestedFields && !(input.requestedFieldIds || []).filter(Boolean).length) {
    return { ok: false, error: "Identify at least one field that requires changes." };
  }
  if (transition.requiresDueDate && !input.newDueAt) {
    return { ok: false, error: "A due date is required for this action." };
  }
  return { ok: true, transition };
}

export function getQualityCaseTaskVisibleSections(taskType: QualityCaseTaskType): readonly QualityCaseVisibleSection[] {
  if (taskType === "supplier_response") {
    return ["case_summary", "supplier_task", "supplier_evidence"];
  }
  if (taskType === "verification_response") {
    return ["case_summary", "verification_plan", "verification_execution", "verification_result", "verification_evidence"];
  }
  return ["case_summary", "customer_response", "customer_evidence", "customer_comments"];
}

export function getQualityCaseDisplayText(text: BilingualText, preferredLanguage: "en" | "zh-CN") {
  if (text.original.language === preferredLanguage) return text.original.text;
  if (text.confirmedTranslation?.language === preferredLanguage) return text.confirmedTranslation.text;
  return text.original.text;
}

export function isQualityCaseOverdue(input: {
  status: QualityCaseStatus;
  dueAt: Date | null;
  now?: Date;
}) {
  if (!input.dueAt || input.status === "closed") return false;
  return input.dueAt.getTime() < (input.now || new Date()).getTime();
}
