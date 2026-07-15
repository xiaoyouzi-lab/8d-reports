import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseEvidence,
  qualityCaseVerificationAudits,
  qualityCaseVerificationCoachRuns,
  qualityCaseVerificationCycles,
  qualityCaseVerificationEvidence,
  qualityCaseVerificationExecutions,
  qualityCaseVerificationPlans,
  qualityCaseVerificationResults,
  qualityCaseVerificationReviews,
} from "@/lib/db/schema";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";
import { transitionQualityCase } from "@/lib/quality-cases/service";

export const VERIFICATION_COACH_PROMPT = {
  identifier: "quality-verification-coach",
  version: "g7-v1",
  role: "Advise on verification completeness and risk without making a quality decision.",
  forbiddenOutputs: [
    "approved",
    "confirmedEffective",
    "closeCase",
    "reopenCase",
    "workflowTransition",
  ],
} as const;

export type VerificationStatus =
  | "verification_planning"
  | "verification_in_progress"
  | "verification_submitted"
  | "internal_verification_review"
  | "verified_effective"
  | "verification_failed";

export type VerificationPlanInput = {
  method: string;
  description: string;
  ownerName: string;
  organization: string;
  plannedStartAt: string | Date;
  plannedEndAt: string | Date;
  dueAt: string | Date;
  sampleSize: number;
  sampleScope: string;
  acceptanceCriteria: string;
};

export type VerificationExecutionInput = {
  executorName: string;
  executorOrganization: string;
  executionStartAt: string | Date;
  executionEndAt: string | Date;
  actualScope: string;
  executionNotes: string;
  resultSummary: string;
  actualSampleSize: number;
  passFail: "pass" | "fail" | "inconclusive";
  criteriaComparison: string;
};

export type VerificationReadiness = {
  advisoryOnly: true;
  missing: string[];
  warnings: string[];
  suggestions: string[];
};

export class VerificationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const clean = (value: unknown, max = 6000) =>
  typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

const date = (value: string | Date) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new VerificationError(400, "A valid date is required.");
  return parsed;
};

export function assessVerificationReadiness(input: {
  plan?: Partial<VerificationPlanInput> | null;
  execution?: Partial<VerificationExecutionInput> | null;
  evidenceCount?: number;
}): VerificationReadiness {
  const missing: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const plan = input.plan || {};
  const execution = input.execution || {};
  if (!clean(plan.method)) missing.push("Verification method");
  if (!clean(plan.ownerName)) missing.push("Owner");
  if (!clean(plan.organization)) missing.push("Organization");
  if (!plan.plannedStartAt || !plan.plannedEndAt || !plan.dueAt) missing.push("Planned dates and due date");
  if (!Number.isInteger(plan.sampleSize) || Number(plan.sampleSize) <= 0) missing.push("Sample size");
  if (!clean(plan.sampleScope)) missing.push("Sample scope");
  if (!clean(plan.acceptanceCriteria)) missing.push("Acceptance criteria");
  if (execution.resultSummary !== undefined && !clean(execution.resultSummary)) missing.push("Actual result summary");
  if (execution.actualSampleSize !== undefined && Number(execution.actualSampleSize) <= 0) missing.push("Actual sample size");
  if (input.evidenceCount === 0) {
    warnings.push("No verification evidence is attached. Submission is allowed, but approval is not.");
    suggestions.push("Attach a test report, inspection record, or traceable verification data.");
  }
  const scope = clean(plan.sampleScope).toLowerCase();
  if (Number(plan.sampleSize) > 0 && !/(batch|lot|shift|line|condition|批|班|线|条件)/i.test(scope)) {
    warnings.push("The sample scope does not explain whether results cover batches or different production conditions.");
    suggestions.push("State whether samples cover one batch, consecutive batches, or different production conditions.");
  }
  return { advisoryOnly: true, missing: [...new Set(missing)], warnings, suggestions };
}

export function validateVerificationCoachOutput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return !VERIFICATION_COACH_PROMPT.forbiddenOutputs.some((key) => key in record);
}

export function nextVerificationCycleNumber(cycles: readonly { cycleNumber: number }[]) {
  return cycles.reduce((maximum, cycle) => Math.max(maximum, cycle.cycleNumber), 0) + 1;
}

async function requireInternal(caseId: string, userId: string) {
  const access = await getQualityCaseAccess(caseId, userId);
  if (!access) throw new VerificationError(404, "Quality Case not found.");
  if (!access.canEdit) throw new VerificationError(403, "You cannot edit verification for this case.");
  return access;
}

async function latestCycle(caseId: string) {
  const [cycle] = await db.select().from(qualityCaseVerificationCycles)
    .where(eq(qualityCaseVerificationCycles.caseId, caseId))
    .orderBy(desc(qualityCaseVerificationCycles.cycleNumber)).limit(1);
  return cycle || null;
}

async function actorOrganization(caseId: string, userId: string) {
  const access = await getQualityCaseAccess(caseId, userId);
  return clean((access?.qualityCase.caseData as Record<string, unknown> | null)?.coordinatorOrganization, 180)
    || "Internal organization";
}

async function audit(input: {
  caseId: string; cycleId: string | null; userId: string; role: string; action: string;
  fromStatus?: string | null; toStatus?: string | null; reason?: string; metadata?: Record<string, unknown>;
}) {
  await db.insert(qualityCaseVerificationAudits).values({
    caseId: input.caseId,
    cycleId: input.cycleId,
    actorId: input.userId,
    actorOrganization: await actorOrganization(input.caseId, input.userId),
    actorRole: input.role,
    action: input.action,
    fromStatus: input.fromStatus || null,
    toStatus: input.toStatus || null,
    reason: clean(input.reason, 4000) || null,
    metadata: input.metadata || {},
  });
}

export async function getVerificationWorkspace(caseId: string, userId: string) {
  const access = await requireInternal(caseId, userId);
  const cycles = await db.select().from(qualityCaseVerificationCycles)
    .where(eq(qualityCaseVerificationCycles.caseId, caseId))
    .orderBy(desc(qualityCaseVerificationCycles.cycleNumber));
  const active = cycles[0] || null;
  if (!active) return { access, cycles, active: null, plan: null, execution: null, result: null, evidence: [], reviews: [], audits: [], coachRuns: [] };
  const [plans, executions, audits, coachRuns] = await Promise.all([
    db.select().from(qualityCaseVerificationPlans).where(eq(qualityCaseVerificationPlans.cycleId, active.id)).limit(1),
    db.select().from(qualityCaseVerificationExecutions).where(eq(qualityCaseVerificationExecutions.cycleId, active.id)).limit(1),
    db.select().from(qualityCaseVerificationAudits).where(eq(qualityCaseVerificationAudits.cycleId, active.id)).orderBy(desc(qualityCaseVerificationAudits.createdAt)),
    db.select().from(qualityCaseVerificationCoachRuns).where(eq(qualityCaseVerificationCoachRuns.cycleId, active.id)).orderBy(desc(qualityCaseVerificationCoachRuns.generatedAt)),
  ]);
  const execution = executions[0] || null;
  const [results, evidence, reviews] = execution ? await Promise.all([
    db.select().from(qualityCaseVerificationResults).where(eq(qualityCaseVerificationResults.executionId, execution.id)).limit(1),
    db.select({ link: qualityCaseVerificationEvidence, evidence: qualityCaseEvidence })
      .from(qualityCaseVerificationEvidence)
      .innerJoin(qualityCaseVerificationResults, eq(qualityCaseVerificationEvidence.resultId, qualityCaseVerificationResults.id))
      .innerJoin(qualityCaseEvidence, eq(qualityCaseVerificationEvidence.evidenceId, qualityCaseEvidence.id))
      .where(eq(qualityCaseVerificationResults.executionId, execution.id)),
    db.select({ review: qualityCaseVerificationReviews }).from(qualityCaseVerificationReviews)
      .innerJoin(qualityCaseVerificationResults, eq(qualityCaseVerificationReviews.resultId, qualityCaseVerificationResults.id))
      .where(eq(qualityCaseVerificationResults.executionId, execution.id)).orderBy(desc(qualityCaseVerificationReviews.createdAt)),
  ]) : [[], [], []];
  return { access, cycles, active, plan: plans[0] || null, execution, result: results[0] || null, evidence, reviews, audits, coachRuns };
}

export async function saveVerificationPlan(input: { caseId: string; userId: string; plan: VerificationPlanInput }) {
  const access = await requireInternal(input.caseId, input.userId);
  if (!access.canManageWorkflow) throw new VerificationError(403, "Only a coordinator or case owner can create the verification cycle.");
  if (!["customer_accepted", "effectiveness_verification", "verification_planning"].includes(access.qualityCase.status))
    throw new VerificationError(409, "A verification plan cannot be edited in the current case state.");
  if (input.plan.sampleSize <= 0 || !Number.isInteger(input.plan.sampleSize)) throw new VerificationError(400, "Sample size must be a positive whole number.");
  const normalized = {
    method: clean(input.plan.method), description: clean(input.plan.description), ownerName: clean(input.plan.ownerName, 180),
    organization: clean(input.plan.organization, 180), plannedStartAt: date(input.plan.plannedStartAt), plannedEndAt: date(input.plan.plannedEndAt),
    dueAt: date(input.plan.dueAt), sampleSize: input.plan.sampleSize, sampleScope: clean(input.plan.sampleScope),
    acceptanceCriteria: clean(input.plan.acceptanceCriteria), updatedAt: new Date(),
  };
  if (Object.entries(normalized).some(([key, value]) => key !== "updatedAt" && (value === "" || value == null)))
    throw new VerificationError(400, "Complete every verification-plan field before saving.");
  let cycle = await latestCycle(input.caseId);
  if (!cycle || cycle.status === "verified_effective" || cycle.status === "verification_failed") {
    const [created] = await db.insert(qualityCaseVerificationCycles).values({
      caseId: input.caseId, cycleNumber: (cycle?.cycleNumber || 0) + 1, status: "verification_planning", createdBy: input.userId,
    }).returning();
    cycle = created;
  }
  const [existing] = await db.select().from(qualityCaseVerificationPlans).where(eq(qualityCaseVerificationPlans.cycleId, cycle.id)).limit(1);
  if (existing) await db.update(qualityCaseVerificationPlans).set(normalized).where(eq(qualityCaseVerificationPlans.id, existing.id));
  else await db.insert(qualityCaseVerificationPlans).values({ ...normalized, cycleId: cycle.id, createdBy: input.userId });
  if (access.qualityCase.status !== "verification_planning") {
    const transitioned = await transitionQualityCase({
      caseId: input.caseId, actor: { id: input.userId },
      action: access.qualityCase.status === "customer_accepted" ? "start_effectiveness_verification" : "begin_verification_planning",
    });
    if (!transitioned.ok) throw new VerificationError(transitioned.status, transitioned.error);
  }
  await audit({ caseId: input.caseId, cycleId: cycle.id, userId: input.userId, role: "coordinator", action: existing ? "plan_updated" : "plan_created", fromStatus: access.qualityCase.status, toStatus: "verification_planning" });
  return getVerificationWorkspace(input.caseId, input.userId);
}

export async function startVerificationExecution(caseId: string, userId: string) {
  const workspace = await getVerificationWorkspace(caseId, userId);
  if (!workspace.plan || !workspace.active) throw new VerificationError(400, "Create a complete verification plan first.");
  const transition = await transitionQualityCase({ caseId, actor: { id: userId }, action: "start_verification_execution" });
  if (!transition.ok) throw new VerificationError(transition.status, transition.error);
  await db.update(qualityCaseVerificationCycles).set({ status: "verification_in_progress" }).where(eq(qualityCaseVerificationCycles.id, workspace.active.id));
  await audit({ caseId, cycleId: workspace.active.id, userId, role: "coordinator", action: "execution_started", fromStatus: "verification_planning", toStatus: "verification_in_progress" });
  return getVerificationWorkspace(caseId, userId);
}

export async function saveVerificationExecution(input: { caseId: string; userId: string; execution: VerificationExecutionInput }) {
  const workspace = await getVerificationWorkspace(input.caseId, input.userId);
  if (!workspace.active || !workspace.plan) throw new VerificationError(400, "A verification plan is required.");
  if (workspace.access.qualityCase.status !== "verification_in_progress") throw new VerificationError(409, "Verification is not in progress.");
  if (input.execution.actualSampleSize <= 0 || !Number.isInteger(input.execution.actualSampleSize)) throw new VerificationError(400, "Actual sample size must be a positive whole number.");
  const executionValues = {
    executorName: clean(input.execution.executorName, 180), executorOrganization: clean(input.execution.executorOrganization, 180),
    executionStartAt: date(input.execution.executionStartAt), executionEndAt: date(input.execution.executionEndAt),
    actualScope: clean(input.execution.actualScope), executionNotes: clean(input.execution.executionNotes), updatedBy: input.userId, updatedAt: new Date(),
  };
  let execution = workspace.execution;
  if (execution) {
    [execution] = await db.update(qualityCaseVerificationExecutions).set(executionValues).where(eq(qualityCaseVerificationExecutions.id, execution.id)).returning();
  } else {
    [execution] = await db.insert(qualityCaseVerificationExecutions).values({ ...executionValues, cycleId: workspace.active.id }).returning();
  }
  const resultValues = {
    resultSummary: clean(input.execution.resultSummary), actualSampleSize: input.execution.actualSampleSize,
    passFail: input.execution.passFail, criteriaComparison: clean(input.execution.criteriaComparison), status: "draft", updatedAt: new Date(),
  };
  if (workspace.result) await db.update(qualityCaseVerificationResults).set(resultValues).where(eq(qualityCaseVerificationResults.id, workspace.result.id));
  else await db.insert(qualityCaseVerificationResults).values({ ...resultValues, executionId: execution.id });
  await audit({ caseId: input.caseId, cycleId: workspace.active.id, userId: input.userId, role: workspace.access.role, action: "execution_result_saved" });
  return getVerificationWorkspace(input.caseId, input.userId);
}

export async function submitVerification(caseId: string, userId: string) {
  const workspace = await getVerificationWorkspace(caseId, userId);
  if (!workspace.active || !workspace.plan || !workspace.execution || !workspace.result) throw new VerificationError(400, "Plan, execution, and result are required before submission.");
  const readiness = assessVerificationReadiness({ plan: workspace.plan, execution: { ...workspace.execution, ...workspace.result, passFail: workspace.result.passFail as VerificationExecutionInput["passFail"] }, evidenceCount: workspace.evidence.length });
  if (readiness.missing.length) throw new VerificationError(400, `Complete required information: ${readiness.missing.join(", ")}.`);
  const transition = await transitionQualityCase({ caseId, actor: { id: userId }, action: "submit_verification" });
  if (!transition.ok) throw new VerificationError(transition.status, transition.error);
  await db.update(qualityCaseVerificationResults).set({ status: "submitted", submittedBy: userId, submittedAt: new Date(), updatedAt: new Date() }).where(eq(qualityCaseVerificationResults.id, workspace.result.id));
  await db.update(qualityCaseVerificationCycles).set({ status: "verification_submitted" }).where(eq(qualityCaseVerificationCycles.id, workspace.active.id));
  await audit({ caseId, cycleId: workspace.active.id, userId, role: workspace.access.role, action: "verification_submitted", fromStatus: "verification_in_progress", toStatus: "verification_submitted", metadata: { warnings: readiness.warnings } });
  return { workspace: await getVerificationWorkspace(caseId, userId), readiness };
}

/** Links an already authorized Case evidence record to the current result. */
export async function linkVerificationEvidence(input: {
  caseId: string; userId: string; evidenceId: string; evidenceType: string; description: string;
}) {
  const workspace = await getVerificationWorkspace(input.caseId, input.userId);
  if (!workspace.active || !workspace.result) throw new VerificationError(400, "Save a verification result before linking evidence.");
  if (!["verification_in_progress", "verification_submitted", "internal_verification_review"].includes(workspace.access.qualityCase.status))
    throw new VerificationError(409, "Evidence cannot be changed in the current case state.");
  const [evidence] = await db.select().from(qualityCaseEvidence).where(and(eq(qualityCaseEvidence.id, input.evidenceId), eq(qualityCaseEvidence.caseId, input.caseId))).limit(1);
  if (!evidence) throw new VerificationError(404, "Evidence not found in this Quality Case.");
  await db.insert(qualityCaseVerificationEvidence).values({
    resultId: workspace.result.id, evidenceId: evidence.id, evidenceType: clean(input.evidenceType, 80) || "verification_record",
    description: clean(input.description, 1000) || "Verification evidence", uploadedBy: input.userId,
  }).onConflictDoNothing();
  await audit({ caseId: input.caseId, cycleId: workspace.active.id, userId: input.userId, role: workspace.access.role, action: "evidence_linked", metadata: { evidenceId: evidence.id, resultId: workspace.result.id } });
  return getVerificationWorkspace(input.caseId, input.userId);
}

export async function createVerificationEvidenceRecord(input: {
  caseId: string; userId: string; storagePath: string; filename: string; mimeType: string; fileSize: number;
  evidenceType: string; description: string;
}) {
  const workspace = await getVerificationWorkspace(input.caseId, input.userId);
  if (!workspace.active || !workspace.result) throw new VerificationError(400, "Save a verification result before uploading evidence.");
  if (workspace.access.qualityCase.status !== "verification_in_progress") throw new VerificationError(409, "Evidence uploads are allowed while verification is in progress.");
  const evidenceId = crypto.randomUUID();
  await db.batch([
    db.insert(qualityCaseEvidence).values({ id: evidenceId, caseId: input.caseId, visibility: "internal", storagePath: input.storagePath, filename: input.filename, mimeType: input.mimeType, fileSize: input.fileSize }),
    db.insert(qualityCaseVerificationEvidence).values({ resultId: workspace.result.id, evidenceId, evidenceType: clean(input.evidenceType, 80) || "verification_record", description: clean(input.description, 1000) || "Verification evidence", uploadedBy: input.userId }),
  ]);
  await audit({ caseId: input.caseId, cycleId: workspace.active.id, userId: input.userId, role: workspace.access.role, action: "evidence_uploaded", metadata: { evidenceId, resultId: workspace.result.id } });
  return getVerificationWorkspace(input.caseId, input.userId);
}

/** Deterministic baseline coach; advisory output is persisted for traceability. */
export async function runVerificationCoach(caseId: string, userId: string) {
  const workspace = await getVerificationWorkspace(caseId, userId);
  if (!workspace.active) throw new VerificationError(400, "Create a verification cycle first.");
  const response = assessVerificationReadiness({
    plan: workspace.plan,
    execution: workspace.execution && workspace.result ? { ...workspace.execution, ...workspace.result, passFail: workspace.result.passFail as VerificationExecutionInput["passFail"] } : null,
    evidenceCount: workspace.evidence.length,
  });
  if (!validateVerificationCoachOutput(response)) throw new VerificationError(500, "Verification Coach policy rejected the response.");
  const inputSnapshot = JSON.stringify({ plan: workspace.plan, execution: workspace.execution, result: workspace.result, evidenceIds: workspace.evidence.map(({ evidence }) => evidence.id) });
  const inputHash = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(inputSnapshot))).toString("hex");
  await db.insert(qualityCaseVerificationCoachRuns).values({
    caseId, cycleId: workspace.active.id, sourceType: "deterministic_rules", promptIdentifier: VERIFICATION_COACH_PROMPT.identifier,
    promptVersion: VERIFICATION_COACH_PROMPT.version, promptInputHash: inputHash, modelIdentifier: null, response,
    confidence: "deterministic", policyOutcome: "advisory_only",
  });
  return response;
}

export async function reviewVerification(input: { caseId: string; userId: string; decision: "approved" | "requested_changes" | "failed"; comment: string }) {
  let workspace = await getVerificationWorkspace(input.caseId, input.userId);
  if (!workspace.access.canManageWorkflow) throw new VerificationError(403, "Only an authorized internal reviewer can review verification.");
  if (workspace.access.qualityCase.status === "verification_submitted") {
    const started = await transitionQualityCase({ caseId: input.caseId, actor: { id: input.userId }, action: "start_verification_review" });
    if (!started.ok) throw new VerificationError(started.status, started.error);
    if (workspace.active) await db.update(qualityCaseVerificationCycles).set({ status: "internal_verification_review" }).where(eq(qualityCaseVerificationCycles.id, workspace.active.id));
    workspace = await getVerificationWorkspace(input.caseId, input.userId);
  }
  if (!workspace.active || !workspace.result) throw new VerificationError(400, "A submitted verification result is required.");
  if (workspace.access.qualityCase.status !== "internal_verification_review") throw new VerificationError(409, "Verification is not awaiting internal review.");
  if (!clean(input.comment)) throw new VerificationError(400, "A review comment is required.");
  if (input.decision === "approved" && workspace.evidence.length === 0) throw new VerificationError(400, "At least one result-linked evidence file is required for approval.");
  const action = input.decision === "approved" ? "approve_verification" : input.decision === "requested_changes" ? "request_verification_evidence" : "mark_verification_failed";
  const transition = await transitionQualityCase({ caseId: input.caseId, actor: { id: input.userId }, action, comment: input.comment });
  if (!transition.ok) throw new VerificationError(transition.status, transition.error);
  const cycleStatus = input.decision === "failed" ? "verification_failed" : transition.value.status;
  await db.update(qualityCaseVerificationCycles).set({ status: cycleStatus, completedAt: input.decision === "approved" || input.decision === "failed" ? new Date() : null }).where(eq(qualityCaseVerificationCycles.id, workspace.active.id));
  await db.insert(qualityCaseVerificationReviews).values({ resultId: workspace.result.id, reviewerId: input.userId, reviewerOrganization: await actorOrganization(input.caseId, input.userId), decision: input.decision, comment: clean(input.comment, 4000) });
  await audit({ caseId: input.caseId, cycleId: workspace.active.id, userId: input.userId, role: workspace.access.role, action: `review_${input.decision}`, fromStatus: "internal_verification_review", toStatus: cycleStatus, reason: input.comment });
  return getVerificationWorkspace(input.caseId, input.userId);
}

export async function closeVerifiedCase(input: { caseId: string; userId: string; comment: string }) {
  const workspace = await getVerificationWorkspace(input.caseId, input.userId);
  if (!workspace.access.canManageWorkflow) throw new VerificationError(403, "Only an authorized coordinator can close this case.");
  if (workspace.access.qualityCase.status !== "verified_effective" || workspace.active?.status !== "verified_effective" || !workspace.plan || !workspace.result || !workspace.evidence.length || !workspace.reviews.some(({ review }) => review.decision === "approved"))
    throw new VerificationError(409, "The case can close only after a result-linked evidence file and human approval establish Verified Effective.");
  const transition = await transitionQualityCase({ caseId: input.caseId, actor: { id: input.userId }, action: "close_case", comment: input.comment, evidenceIds: workspace.evidence.map(({ evidence }) => evidence.id) });
  if (!transition.ok) throw new VerificationError(transition.status, transition.error);
  await audit({ caseId: input.caseId, cycleId: workspace.active.id, userId: input.userId, role: workspace.access.role, action: "case_closed", fromStatus: "verified_effective", toStatus: "closed", reason: input.comment, metadata: { finalVerificationResultId: workspace.result.id, finalVersion: transition.value.currentVersion } });
  return getVerificationWorkspace(input.caseId, input.userId);
}
