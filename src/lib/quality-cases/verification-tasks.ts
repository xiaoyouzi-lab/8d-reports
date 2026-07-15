import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseActivities, qualityCaseEvidence, qualityCaseParticipants, qualityCases, qualityCaseTaskLinks,
  qualityCaseVerificationAudits, qualityCaseVerificationCycles, qualityCaseVerificationEvidence,
  qualityCaseVerificationExecutions, qualityCaseVerificationPlans, qualityCaseVerificationResults, qualityCaseVersions,
} from "@/lib/db/schema";
import { getQualityCaseAccess } from "./access";
import { assessVerificationReadiness, type VerificationExecutionInput, type VerificationPlanInput, VerificationError } from "./effectiveness-verification";
import { createQualityCaseTaskToken, hashQualityCaseTaskToken, isActiveQualityCaseTaskLink } from "./task-tokens";
import { transitionQualityCase } from "./service";

const clean = (value: unknown, max = 6000) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
const parsedDate = (value: unknown) => { const result = new Date(String(value)); if (Number.isNaN(result.getTime())) throw new VerificationError(400, "A valid date is required."); return result; };

async function tokenRow(token: string, requireActive = true) {
  const [row] = await db.select({ task: qualityCaseTaskLinks, qualityCase: qualityCases, participant: qualityCaseParticipants })
    .from(qualityCaseTaskLinks).innerJoin(qualityCases, eq(qualityCaseTaskLinks.caseId, qualityCases.id))
    .leftJoin(qualityCaseParticipants, eq(qualityCaseTaskLinks.participantId, qualityCaseParticipants.id))
    .where(and(eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token)), eq(qualityCaseTaskLinks.taskType, "verification_response"))).limit(1);
  const readable = row && !row.task.revokedAt && row.task.expiresAt.getTime() > Date.now();
  if (!readable || (requireActive && !isActiveQualityCaseTaskLink(row.task))) throw new VerificationError(404, "This verification link is unavailable or expired.");
  return row;
}

async function cycleData(caseId: string, cycleId: string) {
  const [cycle] = await db.select().from(qualityCaseVerificationCycles).where(and(eq(qualityCaseVerificationCycles.id, cycleId), eq(qualityCaseVerificationCycles.caseId, caseId))).limit(1);
  if (!cycle) throw new VerificationError(404, "Verification cycle not found.");
  const [plan] = await db.select().from(qualityCaseVerificationPlans).where(eq(qualityCaseVerificationPlans.cycleId, cycle.id)).limit(1);
  const [execution] = await db.select().from(qualityCaseVerificationExecutions).where(eq(qualityCaseVerificationExecutions.cycleId, cycle.id)).limit(1);
  const [result] = execution ? await db.select().from(qualityCaseVerificationResults).where(eq(qualityCaseVerificationResults.executionId, execution.id)).limit(1) : [];
  const evidence = result ? await db.select({ link: qualityCaseVerificationEvidence, evidence: qualityCaseEvidence }).from(qualityCaseVerificationEvidence)
    .innerJoin(qualityCaseEvidence, eq(qualityCaseVerificationEvidence.evidenceId, qualityCaseEvidence.id)).where(eq(qualityCaseVerificationEvidence.resultId, result.id)) : [];
  return { cycle, plan: plan || null, execution: execution || null, result: result || null, evidence };
}

function authorizedCycle(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return clean((value as Record<string, unknown>).verificationCycleId, 50);
}

export async function createSupplierVerificationTask(input: { caseId: string; userId: string; participantName: string; organization: string; expiresAt: string }) {
  const access = await getQualityCaseAccess(input.caseId, input.userId);
  if (!access) throw new VerificationError(404, "Quality Case not found.");
  if (!access.canAssignExternalTasks) throw new VerificationError(403, "Only the case owner can invite a supplier verifier.");
  if (!["customer_accepted", "effectiveness_verification", "verification_planning"].includes(access.qualityCase.status)) throw new VerificationError(409, "A supplier verification task cannot be created in this state.");
  const name = clean(input.participantName, 180); const organization = clean(input.organization, 180); const expiresAt = parsedDate(input.expiresAt);
  if (!name || !organization || expiresAt <= new Date()) throw new VerificationError(400, "Supplier name, organization, and a future expiry are required.");
  let [cycle] = await db.select().from(qualityCaseVerificationCycles).where(eq(qualityCaseVerificationCycles.caseId, input.caseId)).orderBy(desc(qualityCaseVerificationCycles.cycleNumber)).limit(1);
  if (!cycle || cycle.status === "verification_failed" || cycle.status === "verified_effective") {
    const [created] = await db.insert(qualityCaseVerificationCycles).values({ caseId: input.caseId, cycleNumber: (cycle?.cycleNumber || 0) + 1, status: "verification_planning", createdBy: input.userId }).returning(); cycle = created;
  }
  if (access.qualityCase.status !== "verification_planning") {
    const moved = await transitionQualityCase({ caseId: input.caseId, actor: { id: input.userId }, action: access.qualityCase.status === "customer_accepted" ? "start_effectiveness_verification" : "begin_verification_planning" });
    if (!moved.ok) throw new VerificationError(moved.status, moved.error);
  }
  const token = createQualityCaseTaskToken();
  const [participant] = await db.insert(qualityCaseParticipants).values({ caseId: input.caseId, role: "supplier", displayName: name, organizationName: organization, isInternal: false }).returning();
  await db.insert(qualityCaseTaskLinks).values({ caseId: input.caseId, participantId: participant.id, taskType: "verification_response", tokenHash: hashQualityCaseTaskToken(token), allowedSections: ["case_summary", "verification_plan", "verification_execution", "verification_result", "verification_evidence"], authorizedResponse: { verificationCycleId: cycle.id }, expiresAt, createdBy: input.userId });
  await db.insert(qualityCaseVerificationAudits).values({ caseId: input.caseId, cycleId: cycle.id, actorId: input.userId, actorOrganization: organization, actorRole: access.role, action: "supplier_verification_invited", fromStatus: "verification_planning", toStatus: "verification_planning", metadata: { participantId: participant.id } });
  return { token, expiresAt, cycleId: cycle.id };
}

export async function getSupplierVerificationTask(token: string) {
  const row = await tokenRow(token, false);
  const cycleId = authorizedCycle(row.task.authorizedResponse);
  const data = await cycleData(row.qualityCase.id, cycleId);
  return {
    task: { completed: !!row.task.completedAt, expiresAt: row.task.expiresAt, participantName: row.participant?.displayName || "Supplier", organization: row.participant?.organizationName || "Supplier" },
    qualityCase: { id: row.qualityCase.id, title: row.qualityCase.title, status: row.qualityCase.status, dueAt: row.qualityCase.dueAt, caseData: row.qualityCase.caseData },
    ...data,
    readiness: assessVerificationReadiness({ plan: data.plan, execution: data.result ? { ...data.execution, ...data.result, passFail: data.result.passFail as VerificationExecutionInput["passFail"] } : null, evidenceCount: data.evidence.length }),
  };
}

export async function saveSupplierVerificationPlan(token: string, plan: VerificationPlanInput) {
  const row = await tokenRow(token); const cycleId = authorizedCycle(row.task.authorizedResponse);
  if (row.qualityCase.status !== "verification_planning") throw new VerificationError(409, "The verification plan is no longer editable.");
  if (!Number.isInteger(plan.sampleSize) || plan.sampleSize <= 0) throw new VerificationError(400, "Sample size must be a positive whole number.");
  const values = { method: clean(plan.method), description: clean(plan.description), ownerName: clean(plan.ownerName, 180), organization: clean(plan.organization, 180), plannedStartAt: parsedDate(plan.plannedStartAt), plannedEndAt: parsedDate(plan.plannedEndAt), dueAt: parsedDate(plan.dueAt), sampleSize: plan.sampleSize, sampleScope: clean(plan.sampleScope), acceptanceCriteria: clean(plan.acceptanceCriteria), createdByParticipantId: row.task.participantId, updatedAt: new Date() };
  if (Object.values(values).some((value) => value === "")) throw new VerificationError(400, "Complete every verification plan field.");
  const [existing] = await db.select().from(qualityCaseVerificationPlans).where(eq(qualityCaseVerificationPlans.cycleId, cycleId)).limit(1);
  if (existing) await db.update(qualityCaseVerificationPlans).set(values).where(eq(qualityCaseVerificationPlans.id, existing.id));
  else await db.insert(qualityCaseVerificationPlans).values({ ...values, cycleId });
  await db.insert(qualityCaseVerificationAudits).values({ caseId: row.qualityCase.id, cycleId, actorParticipantId: row.task.participantId, actorOrganization: row.participant?.organizationName, actorRole: "supplier", action: existing ? "supplier_plan_updated" : "supplier_plan_created", fromStatus: "verification_planning", toStatus: "verification_planning" });
  return getSupplierVerificationTask(token);
}

export async function startSupplierVerification(token: string) {
  const row = await tokenRow(token); const cycleId = authorizedCycle(row.task.authorizedResponse);
  const data = await cycleData(row.qualityCase.id, cycleId); if (!data.plan) throw new VerificationError(400, "Create a complete plan first.");
  const nextVersion = row.qualityCase.currentVersion + 1;
  const [updated] = await db.update(qualityCases).set({ status: "verification_in_progress", waitingOn: "supplier", nextAction: "Supplier executes verification and submits traceable evidence.", currentVersion: nextVersion, updatedAt: new Date() }).where(and(eq(qualityCases.id, row.qualityCase.id), eq(qualityCases.status, "verification_planning"))).returning();
  if (!updated) throw new VerificationError(409, "The Case changed before execution started.");
  await db.batch([
    db.update(qualityCaseVerificationCycles).set({ status: "verification_in_progress" }).where(eq(qualityCaseVerificationCycles.id, cycleId)),
    db.insert(qualityCaseVersions).values({ caseId: updated.id, version: nextVersion, snapshot: { status: updated.status, waitingOn: updated.waitingOn, nextAction: updated.nextAction }, createdBy: null }),
    db.insert(qualityCaseActivities).values({ caseId: updated.id, version: nextVersion, actionType: "start_verification_execution", actorRole: "supplier", actorOrganization: row.participant?.organizationName, diff: { status: { before: "verification_planning", after: "verification_in_progress" } } }),
    db.insert(qualityCaseVerificationAudits).values({ caseId: updated.id, cycleId, actorParticipantId: row.task.participantId, actorOrganization: row.participant?.organizationName, actorRole: "supplier", action: "execution_started", fromStatus: "verification_planning", toStatus: "verification_in_progress" }),
  ]);
  return getSupplierVerificationTask(token);
}

export async function saveSupplierVerificationResult(token: string, input: VerificationExecutionInput) {
  const row = await tokenRow(token); const cycleId = authorizedCycle(row.task.authorizedResponse);
  if (row.qualityCase.status !== "verification_in_progress") throw new VerificationError(409, "Verification is not in progress.");
  if (!Number.isInteger(input.actualSampleSize) || input.actualSampleSize <= 0) throw new VerificationError(400, "Actual sample size must be a positive whole number.");
  const data = await cycleData(row.qualityCase.id, cycleId);
  const executionValues = { executorName: clean(input.executorName, 180), executorOrganization: clean(input.executorOrganization, 180), executionStartAt: parsedDate(input.executionStartAt), executionEndAt: parsedDate(input.executionEndAt), actualScope: clean(input.actualScope), executionNotes: clean(input.executionNotes), updatedByParticipantId: row.task.participantId, updatedAt: new Date() };
  let execution = data.execution;
  if (execution) [execution] = await db.update(qualityCaseVerificationExecutions).set(executionValues).where(eq(qualityCaseVerificationExecutions.id, execution.id)).returning();
  else [execution] = await db.insert(qualityCaseVerificationExecutions).values({ ...executionValues, cycleId }).returning();
  const resultValues = { resultSummary: clean(input.resultSummary), actualSampleSize: input.actualSampleSize, passFail: input.passFail, criteriaComparison: clean(input.criteriaComparison), status: "draft", updatedAt: new Date() };
  if (data.result) await db.update(qualityCaseVerificationResults).set(resultValues).where(eq(qualityCaseVerificationResults.id, data.result.id)); else await db.insert(qualityCaseVerificationResults).values({ ...resultValues, executionId: execution.id });
  await db.insert(qualityCaseVerificationAudits).values({ caseId: row.qualityCase.id, cycleId, actorParticipantId: row.task.participantId, actorOrganization: row.participant?.organizationName, actorRole: "supplier", action: "supplier_result_saved" });
  return getSupplierVerificationTask(token);
}

export async function createSupplierVerificationEvidence(input: { token: string; storagePath: string; filename: string; mimeType: string; fileSize: number; description: string }) {
  const row = await tokenRow(input.token); const cycleId = authorizedCycle(row.task.authorizedResponse); const data = await cycleData(row.qualityCase.id, cycleId);
  if (row.qualityCase.status !== "verification_in_progress" || !data.result) throw new VerificationError(409, "Save a result before uploading evidence.");
  const evidenceId = crypto.randomUUID();
  await db.batch([
    db.insert(qualityCaseEvidence).values({ id: evidenceId, caseId: row.qualityCase.id, uploadedByParticipantId: row.task.participantId, visibility: "internal", storagePath: input.storagePath, filename: input.filename, mimeType: input.mimeType, fileSize: input.fileSize }),
    db.insert(qualityCaseVerificationEvidence).values({ resultId: data.result.id, evidenceId, evidenceType: "verification_record", description: clean(input.description, 1000) || "Verification evidence", uploadedByParticipantId: row.task.participantId }),
    db.insert(qualityCaseVerificationAudits).values({ caseId: row.qualityCase.id, cycleId, actorParticipantId: row.task.participantId, actorOrganization: row.participant?.organizationName, actorRole: "supplier", action: "supplier_evidence_uploaded", metadata: { evidenceId, resultId: data.result.id } }),
  ]);
  return getSupplierVerificationTask(input.token);
}

export async function submitSupplierVerification(token: string) {
  const row = await tokenRow(token); const cycleId = authorizedCycle(row.task.authorizedResponse); const data = await cycleData(row.qualityCase.id, cycleId);
  if (!data.plan || !data.execution || !data.result) throw new VerificationError(400, "Plan, execution, and result are required.");
  const readiness = assessVerificationReadiness({ plan: data.plan, execution: { ...data.execution, ...data.result, passFail: data.result.passFail as VerificationExecutionInput["passFail"] }, evidenceCount: data.evidence.length });
  if (readiness.missing.length) throw new VerificationError(400, `Complete required information: ${readiness.missing.join(", ")}.`);
  const nextVersion = row.qualityCase.currentVersion + 1; const now = new Date();
  const [updated] = await db.update(qualityCases).set({ status: "verification_submitted", waitingOn: "internal", nextAction: "Internal reviewer checks the verification result and evidence.", currentVersion: nextVersion, updatedAt: now }).where(and(eq(qualityCases.id, row.qualityCase.id), eq(qualityCases.status, "verification_in_progress"))).returning();
  if (!updated) throw new VerificationError(409, "The Case changed before submission.");
  await db.batch([
    db.update(qualityCaseVerificationResults).set({ status: "submitted", submittedByParticipantId: row.task.participantId, submittedAt: now, updatedAt: now }).where(eq(qualityCaseVerificationResults.id, data.result.id)),
    db.update(qualityCaseVerificationCycles).set({ status: "verification_submitted" }).where(eq(qualityCaseVerificationCycles.id, cycleId)),
    db.update(qualityCaseTaskLinks).set({ completedAt: now, updatedAt: now }).where(and(eq(qualityCaseTaskLinks.id, row.task.id), isNull(qualityCaseTaskLinks.completedAt))),
    db.insert(qualityCaseVersions).values({ caseId: updated.id, version: nextVersion, snapshot: { status: updated.status, waitingOn: updated.waitingOn, nextAction: updated.nextAction }, createdBy: null }),
    db.insert(qualityCaseActivities).values({ caseId: updated.id, version: nextVersion, actionType: "submit_verification", actorRole: "supplier", actorOrganization: row.participant?.organizationName, evidenceIds: data.evidence.map(({ evidence }) => evidence.id), diff: { status: { before: "verification_in_progress", after: "verification_submitted" } }, metadata: { warnings: readiness.warnings } }),
    db.insert(qualityCaseVerificationAudits).values({ caseId: updated.id, cycleId, actorParticipantId: row.task.participantId, actorOrganization: row.participant?.organizationName, actorRole: "supplier", action: "verification_submitted", fromStatus: "verification_in_progress", toStatus: "verification_submitted", metadata: { warnings: readiness.warnings } }),
  ]);
  return { status: "verification_submitted", readiness };
}
