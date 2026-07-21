import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseActivities,
  qualityCaseEvidence,
  qualityCaseGuidanceAiRuns,
  qualityCaseGuidanceAnswers,
  qualityCaseGuidanceConfirmations,
  qualityCaseGuidanceEvidenceRequirements,
  qualityCaseGuidanceFieldMappings,
  qualityCaseGuidanceInsights,
  qualityCaseGuidanceSessions,
  qualityCaseParticipants,
  qualityCases,
  qualityCaseTaskLinks,
  qualityCaseTexts,
  qualityCaseVersions,
} from "@/lib/db/schema";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";
import {
  buildCustomerReviewSnapshot,
  normalizeCustomerFieldComments,
  parseCustomerReviewSnapshot,
  type CustomerFeedback,
  type CustomerReviewSnapshot,
} from "@/lib/quality-cases/customer-review";
import {
  getQualityCaseTaskVisibleSections,
  validateQualityCaseAction,
  type QualityCaseAction,
  type QualityCaseTaskType,
  type QualityCaseVisibleSection,
} from "@/lib/quality-cases/contract";
import { projectQualityCaseForExternalTask } from "@/lib/quality-cases/external-projection";
import {
  normalizeQualityCaseDueAt,
  type QualityCaseActor,
  type QualityCaseServiceResult,
} from "@/lib/quality-cases/service";
import {
  buildCustomerAuthorizedResponse,
  type QualityCaseTextForOutput,
} from "@/lib/quality-cases/output-content";
import {
  createQualityCaseTaskToken,
  hashQualityCaseTaskToken,
  isActiveQualityCaseTaskLink,
} from "@/lib/quality-cases/task-tokens";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function safeText(value: unknown, maximum = 4000) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, maximum)
    : "";
}
function taskType(value: unknown): QualityCaseTaskType | null {
  return value === "supplier_response" || value === "customer_review" || value === "verification_response"
    ? value
    : null;
}

export function parseSupplierFollowUpInstructions(value: unknown) {
  const instructions = record(value);
  if (instructions.source !== "internal_review") return null;
  const reason = safeText(instructions.reason, 2000);
  const questions = Array.isArray(instructions.questions)
    ? instructions.questions
        .filter((question): question is string => typeof question === "string")
        .map((question) => safeText(question, 1000))
        .filter(Boolean)
        .slice(0, 10)
    : [];
  const requestedFieldIds = Array.isArray(instructions.requestedFieldIds)
    ? instructions.requestedFieldIds
        .filter((field): field is string => typeof field === "string")
        .map((field) => safeText(field, 180))
        .filter(Boolean)
        .slice(0, 20)
    : [];
  return reason && questions.length
    ? { source: "internal_review" as const, reason, questions, requestedFieldIds }
    : null;
}

function externalSections(
  qualityCase: typeof qualityCases.$inferSelect,
  customerAuthorizedResponse: CustomerReviewSnapshot | null,
  supplierFollowUp: ReturnType<typeof parseSupplierFollowUpInstructions>,
): Partial<Record<QualityCaseVisibleSection, unknown>> {
  const data = record(qualityCase.caseData);
  const complaint = safeText(
    data.complaintSummary || data.problemDescription,
    4000,
  );
  return {
    case_summary: {
      title: qualityCase.title,
      outputType: qualityCase.outputType,
      dueAt: qualityCase.dueAt?.toISOString() || null,
      complaintSummary:
        customerAuthorizedResponse?.issueSummary ||
        complaint ||
        "No relevant data",
    },
    supplier_task: {
      requiredFields: ["rootCause", "correctiveAction", "effectivenessPlan"],
      existingResponse: record(data.supplierResponse),
      followUp: supplierFollowUp,
    },
    supplier_evidence: [],
    customer_response: {
      response: customerAuthorizedResponse?.text || "No relevant data",
      fieldPaths: customerAuthorizedResponse?.fieldPaths || [],
      sections: customerAuthorizedResponse?.sections || [],
      reviewVersion: customerAuthorizedResponse?.caseVersion || null,
      product: customerAuthorizedResponse?.product || "No relevant data",
      supplier: customerAuthorizedResponse?.supplier || null,
      submissionDate: customerAuthorizedResponse?.submissionDate || null,
      authorizedAt: customerAuthorizedResponse?.createdAt || null,
    },
    customer_evidence: customerAuthorizedResponse?.evidence || [],
    customer_comments: [],
    verification_plan: null,
    verification_execution: null,
    verification_result: null,
    verification_evidence: [],
  };
}

function snapshot(qualityCase: typeof qualityCases.$inferSelect) {
  return {
    title: qualityCase.title,
    status: qualityCase.status,
    outputType: qualityCase.outputType,
    priority: qualityCase.priority,
    waitingOn: qualityCase.waitingOn,
    nextAction: qualityCase.nextAction,
    dueAt: qualityCase.dueAt?.toISOString() || null,
    caseData: qualityCase.caseData,
  };
}

export function buildExternalCaseDataUpdate(input: {
  previousCaseData: unknown;
  taskType: QualityCaseTaskType;
  action: "supplier_submit" | "customer_accept" | "request_customer_changes";
  response: string;
  comment: string;
  requestedFieldIds: string[];
  now: Date;
  customerFeedback?: CustomerFeedback | null;
}) {
  const previous = record(input.previousCaseData);
  const previousSupplierResponse = record(previous.supplierResponse);
  const previousCustomerResponse = record(previous.customerResponse);
  if (input.taskType === "supplier_response") {
    const supplierResponse = {
      ...previousSupplierResponse,
      response: input.response,
      submittedAt: input.now.toISOString(),
    };
    return {
      caseData: { ...previous, supplierResponse },
      diff: { supplierResponse: { before: previousSupplierResponse, after: supplierResponse } },
    };
  }
  if (input.action === "customer_accept") {
    const customerResponse = {
      ...previousCustomerResponse,
      response: "accepted",
      acceptedAt: input.now.toISOString(),
    };
    return {
      caseData: { ...previous, customerResponse },
      diff: { customerResponse: { before: previousCustomerResponse, after: customerResponse } },
    };
  }
  const changeRequests = Array.isArray(previousCustomerResponse.changeRequests)
    ? previousCustomerResponse.changeRequests
    : [];
  const customerResponse = {
    ...previousCustomerResponse,
    changeRequests: [
      ...changeRequests,
      {
        comment: input.comment,
        requestedFieldIds: input.requestedFieldIds,
        fieldComments: input.customerFeedback?.fieldComments || [],
        feedbackId: input.customerFeedback?.id || null,
        taskId: input.customerFeedback?.taskId || null,
        customer: input.customerFeedback?.customer || null,
        caseVersion: input.customerFeedback?.caseVersion || null,
        createdAt:
          input.customerFeedback?.submittedAt || input.now.toISOString(),
      },
    ],
  };
  return {
    caseData: { ...previous, customerResponse },
    diff: { customerResponse: { before: previousCustomerResponse, after: customerResponse } },
  };
}

async function buildCustomerTaskAuthorization(
  qualityCase: typeof qualityCases.$inferSelect,
) {
  const [translations, mappingRows, supplierSubmission] = await Promise.all([
    db
      .select({
        fieldPath: qualityCaseTexts.fieldPath,
        original: qualityCaseTexts.original,
        aiTranslation: qualityCaseTexts.aiTranslation,
        confirmedTranslation: qualityCaseTexts.confirmedTranslation,
      })
      .from(qualityCaseTexts)
      .where(eq(qualityCaseTexts.caseId, qualityCase.id)),
    db
      .select({
        mappingId: qualityCaseGuidanceFieldMappings.id,
        sessionId: qualityCaseGuidanceFieldMappings.sessionId,
        semanticKey: qualityCaseGuidanceFieldMappings.semanticKey,
        decision: qualityCaseGuidanceFieldMappings.decision,
        confirmationId: qualityCaseGuidanceFieldMappings.confirmationId,
        decidedAt: qualityCaseGuidanceFieldMappings.decidedAt,
        confirmedSnapshot: qualityCaseGuidanceConfirmations.confirmedSnapshot,
      })
      .from(qualityCaseGuidanceFieldMappings)
      .innerJoin(
        qualityCaseGuidanceConfirmations,
        eq(
          qualityCaseGuidanceFieldMappings.confirmationId,
          qualityCaseGuidanceConfirmations.id,
        ),
      )
      .where(
        and(
          eq(qualityCaseGuidanceFieldMappings.caseId, qualityCase.id),
          eq(qualityCaseGuidanceFieldMappings.decision, "confirmed"),
          eq(qualityCaseGuidanceConfirmations.confirmationType, "field_mapping"),
          eq(qualityCaseGuidanceConfirmations.decision, "confirmed"),
        ),
      )
      .orderBy(desc(qualityCaseGuidanceFieldMappings.decidedAt)),
    db
      .select({
        confirmedAt: qualityCaseGuidanceConfirmations.confirmedAt,
        confirmedSnapshot: qualityCaseGuidanceConfirmations.confirmedSnapshot,
      })
      .from(qualityCaseGuidanceConfirmations)
      .where(
        and(
          eq(qualityCaseGuidanceConfirmations.caseId, qualityCase.id),
          eq(
            qualityCaseGuidanceConfirmations.confirmationType,
            "supplier_response_package",
          ),
          eq(qualityCaseGuidanceConfirmations.decision, "submitted"),
        ),
      )
      .orderBy(desc(qualityCaseGuidanceConfirmations.confirmedAt))
      .limit(1),
  ]);
  const legacy = buildCustomerAuthorizedResponse({
    translations: translations as QualityCaseTextForOutput[],
  });
  const supplierSnapshot = record(supplierSubmission[0]?.confirmedSnapshot);
  const responsePackage = record(supplierSnapshot.responsePackage);
  const packageContext = record(responsePackage.caseContext);
  const latestSessionId = safeText(packageContext.sessionId, 180);
  const seenSemanticKeys = new Set<string>();
  const mappings = mappingRows.flatMap((row) => {
    if (latestSessionId && row.sessionId !== latestSessionId) return [];
    if (seenSemanticKeys.has(row.semanticKey)) return [];
    const confirmed = record(row.confirmedSnapshot);
    const confirmedText = safeText(confirmed.confirmedText, 12000);
    const language = safeText(confirmed.language, 20);
    if (!row.confirmationId || !confirmedText || language !== "en") return [];
    seenSemanticKeys.add(row.semanticKey);
    return [
      {
        mappingId: row.mappingId,
        decision: row.decision,
        confirmationId: row.confirmationId,
        sourceType: "human_confirmation" as const,
        semanticKey: row.semanticKey,
        confirmedText,
        language,
        approvedEvidenceIds: Array.isArray(confirmed.approvedEvidenceIds)
          ? confirmed.approvedEvidenceIds.filter(
              (id): id is string => typeof id === "string",
            )
          : [],
      },
    ];
  });
  const requestedEvidenceIds = [...new Set(
    mappings.flatMap((mapping) => mapping.approvedEvidenceIds),
  )];
  const evidence = requestedEvidenceIds.length
    ? await db
        .select({
          id: qualityCaseEvidence.id,
          filename: qualityCaseEvidence.filename,
          mimeType: qualityCaseEvidence.mimeType,
          fileSize: qualityCaseEvidence.fileSize,
          createdAt: qualityCaseEvidence.createdAt,
        })
        .from(qualityCaseEvidence)
        .where(
          and(
            eq(qualityCaseEvidence.caseId, qualityCase.id),
            inArray(qualityCaseEvidence.id, requestedEvidenceIds),
          ),
        )
    : [];
  const supplier = record(responsePackage.supplier);
  const caseData = record(qualityCase.caseData);
  return buildCustomerReviewSnapshot({
    caseVersion: qualityCase.currentVersion,
    product: caseData.product || caseData.productName || caseData.partNumber,
    supplier: {
      name: supplier.name,
      organization: supplier.organization,
    },
    submissionDate: supplierSubmission[0]?.confirmedAt || null,
    legacySections: legacy.ok ? legacy.value.sections : [],
    mappings,
    evidence: evidence.map((file) => ({
      ...file,
      createdAt: file.createdAt.toISOString(),
    })),
  });
}

export async function createQualityCaseTask(input: {
  caseId: string;
  actor: QualityCaseActor;
  taskType: unknown;
  participantName: unknown;
  participantOrganization: unknown;
  expiresAt: unknown;
  supplierInstructions?: unknown;
}): Promise<
  QualityCaseServiceResult<{
    taskId: string;
    token: string;
    taskType: QualityCaseTaskType;
    expiresAt: Date;
  }>
> {
  const type = taskType(input.taskType);
  const name = safeText(input.participantName, 180);
  const organization = safeText(input.participantOrganization, 180);
  const expiresAt = normalizeQualityCaseDueAt(input.expiresAt);
  if (!type || !name || !organization || !expiresAt)
    return {
      ok: false,
      status: 400,
      error:
        "Task type, participant name, organization, and expiry are required.",
    };
  if (expiresAt.getTime() <= Date.now())
    return {
      ok: false,
      status: 400,
      error: "Task expiry must be in the future.",
    };
  if (type === "verification_response")
    return {
      ok: false,
      status: 400,
      error: "Create supplier verification tasks from the Effectiveness Verification workspace.",
    };
  const access = await getQualityCaseAccess(input.caseId, input.actor.id);
  if (!access)
    return { ok: false, status: 404, error: "Quality Case not found." };
  if (!access.canAssignExternalTasks)
    return {
      ok: false,
      status: 403,
      error: "Only the case coordinator can create external tasks.",
    };
  const action: QualityCaseAction =
    type === "supplier_response"
      ? "send_to_supplier"
      : "send_to_customer_review";
  const validation = validateQualityCaseAction(
    access.qualityCase.status as never,
    {
      action,
      actorRole: "coordinator",
      newDueAt: type === "supplier_response" ? expiresAt : null,
    },
  );
  if (!validation.ok)
    return { ok: false, status: 400, error: validation.error };
  const [coordinator] = await db
    .select({ organizationName: qualityCaseParticipants.organizationName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, input.caseId),
        eq(qualityCaseParticipants.userId, input.actor.id),
        eq(qualityCaseParticipants.role, "coordinator"),
      ),
    )
    .limit(1);
  if (!coordinator?.organizationName)
    return {
      ok: false,
      status: 403,
      error:
        "Coordinator organization is required before sending an external task.",
    };
  const customerResponse =
    type === "customer_review"
      ? await buildCustomerTaskAuthorization(access.qualityCase)
      : null;
  const supplierFollowUp =
    type === "supplier_response"
      ? parseSupplierFollowUpInstructions(input.supplierInstructions)
      : null;
  if (customerResponse && !customerResponse.ok)
    return { ok: false, status: 400, error: customerResponse.error };
  const token = createQualityCaseTaskToken();
  const participantRole =
    type === "supplier_response" ? "supplier" : "customer";
  const [existingParticipant] = await db
    .select()
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, input.caseId),
        eq(qualityCaseParticipants.role, participantRole),
        eq(qualityCaseParticipants.displayName, name),
        eq(qualityCaseParticipants.organizationName, organization),
        eq(qualityCaseParticipants.isInternal, false),
      ),
    )
    .orderBy(qualityCaseParticipants.createdAt)
    .limit(1);
  const participant =
    existingParticipant ||
    (
      await db
        .insert(qualityCaseParticipants)
        .values({
          caseId: input.caseId,
          role: participantRole,
          displayName: name,
          organizationName: organization,
          isInternal: false,
        })
        .returning()
    )[0];
  const [taskLink] = await db.insert(qualityCaseTaskLinks).values({
    caseId: input.caseId,
    participantId: participant.id,
    taskType: type,
    tokenHash: hashQualityCaseTaskToken(token),
    allowedSections: getQualityCaseTaskVisibleSections(type),
    authorizedResponse:
      customerResponse?.ok ? customerResponse.value : supplierFollowUp,
    expiresAt,
    createdBy: input.actor.id,
  }).returning({ id: qualityCaseTaskLinks.id });
  const nextVersion = access.qualityCase.currentVersion + 1;
  const [updated] = await db
    .update(qualityCases)
    .set({
      status: validation.transition.to,
      waitingOn: validation.transition.waitingOn,
      nextAction: validation.transition.nextAction,
      dueAt:
        type === "supplier_response" ? expiresAt : access.qualityCase.dueAt,
      currentVersion: nextVersion,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(qualityCases.id, input.caseId),
        eq(qualityCases.status, access.qualityCase.status),
      ),
    )
    .returning();
  if (!updated)
    return {
      ok: false,
      status: 409,
      error:
        "This case changed before the task was sent. Refresh and try again.",
    };
  await db.insert(qualityCaseVersions).values({
    caseId: updated.id,
    version: nextVersion,
    snapshot: snapshot(updated),
    createdBy: input.actor.id,
  });
  await db.insert(qualityCaseActivities).values({
    caseId: updated.id,
    version: nextVersion,
    actionType: action,
    actorId: input.actor.id,
    actorRole: "coordinator",
    actorOrganization: coordinator.organizationName,
    dueAt: updated.dueAt,
    diff: {
      status: { before: access.qualityCase.status, after: updated.status },
    },
    metadata: {
      taskType: type,
      participantId: participant.id,
      followUpQuestionCount: supplierFollowUp?.questions.length || 0,
    },
  });
  return { ok: true, value: { taskId: taskLink.id, token, taskType: type, expiresAt } };
}

export async function getExternalQualityCaseTask(token: string) {
  const [row] = await db
    .select({
      task: qualityCaseTaskLinks,
      qualityCase: qualityCases,
      participant: qualityCaseParticipants,
    })
    .from(qualityCaseTaskLinks)
    .innerJoin(qualityCases, eq(qualityCaseTaskLinks.caseId, qualityCases.id))
    .leftJoin(
      qualityCaseParticipants,
      eq(qualityCaseTaskLinks.participantId, qualityCaseParticipants.id),
    )
    .where(eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token)))
    .limit(1);
  if (!row || !isActiveQualityCaseTaskLink(row.task)) return null;
  const type = taskType(row.task.taskType);
  if (!type) return null;
  const customerResponse = parseCustomerReviewSnapshot(
    row.task.authorizedResponse,
  );
  const supplierFollowUp = parseSupplierFollowUpInstructions(row.task.authorizedResponse);
  if (type === "customer_review" && !customerResponse) return null;
  return {
    taskType: type,
    expiresAt: row.task.expiresAt,
    participantName: row.participant?.displayName || "External guest",
    projection: projectQualityCaseForExternalTask(
      type,
      externalSections(row.qualityCase, customerResponse, supplierFollowUp),
    ),
    status: row.qualityCase.status,
  };
}

export async function getAuthorizedCustomerEvidence(
  token: string,
  evidenceId: string,
) {
  const [row] = await db
    .select({ task: qualityCaseTaskLinks })
    .from(qualityCaseTaskLinks)
    .where(
      and(
        eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token)),
        eq(qualityCaseTaskLinks.taskType, "customer_review"),
      ),
    )
    .limit(1);
  const snapshot = row
    ? parseCustomerReviewSnapshot(row.task.authorizedResponse)
    : null;
  if (
    !row ||
    !isActiveQualityCaseTaskLink(row.task) ||
    !snapshot?.evidence.some((file) => file.id === evidenceId)
  )
    return null;
  const [evidence] = await db
    .select()
    .from(qualityCaseEvidence)
    .where(
      and(
        eq(qualityCaseEvidence.id, evidenceId),
        eq(qualityCaseEvidence.caseId, row.task.caseId),
      ),
    )
    .limit(1);
  return evidence || null;
}

export async function claimCompletedQualityCaseTask(
  token: string,
  userId: string,
): Promise<QualityCaseServiceResult<{ claimed: true }>> {
  const now = new Date();
  const [claimed] = await db
    .update(qualityCaseTaskLinks)
    .set({ claimedByUserId: userId, updatedAt: now })
    .where(
      and(
        eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token)),
        isNull(qualityCaseTaskLinks.claimedByUserId),
        isNotNull(qualityCaseTaskLinks.completedAt),
      ),
    )
    .returning();
  if (claimed) return { ok: true, value: { claimed: true } };
  const [completed] = await db
    .select({
      id: qualityCaseTaskLinks.id,
      claimedByUserId: qualityCaseTaskLinks.claimedByUserId,
    })
    .from(qualityCaseTaskLinks)
    .where(eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token)))
    .limit(1);
  if (!completed) return { ok: false, status: 404, error: "Task not found." };
  if (completed.claimedByUserId === userId)
    return { ok: true, value: { claimed: true } };
  return { ok: false, status: 409, error: "This task cannot be claimed." };
}

export async function revokeQualityCaseTask(input: {
  caseId: string;
  taskId: string;
  userId: string;
}): Promise<QualityCaseServiceResult<{ revoked: true }>> {
  const access = await getQualityCaseAccess(input.caseId, input.userId);
  if (!access)
    return { ok: false, status: 404, error: "Quality Case not found." };
  if (!access.canAssignExternalTasks)
    return {
      ok: false,
      status: 403,
      error: "Only the case coordinator can revoke external tasks.",
    };
  const [updated] = await db
    .update(qualityCaseTaskLinks)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(qualityCaseTaskLinks.id, input.taskId),
        eq(qualityCaseTaskLinks.caseId, input.caseId),
        isNull(qualityCaseTaskLinks.revokedAt),
        isNull(qualityCaseTaskLinks.completedAt),
        gt(qualityCaseTaskLinks.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!updated)
    return { ok: false, status: 404, error: "Active task not found." };
  return { ok: true, value: { revoked: true } };
}

export async function submitExternalQualityCaseTask(input: {
  token: string;
  action: unknown;
  response?: unknown;
  comment?: unknown;
  requestedFieldIds?: unknown[];
  fieldComments?: unknown;
  evidenceIds?: unknown[];
  submissionMetadata?: Record<string, unknown>;
  /** Internal-only atomic payload prepared by Supplier Response Package. */
  supplierPackageSubmission?: {
    confirmation: typeof qualityCaseGuidanceConfirmations.$inferInsert;
    sessionId: string;
    submittedAt: Date;
    expectedLedgerCounts: {
      answers: number;
      aiRuns: number;
      insights: number;
      evidenceRequirements: number;
      evidence: number;
      mappings: number;
    };
  };
}): Promise<
  QualityCaseServiceResult<{ status: string; feedbackId?: string }>
> {
  const database = db;
  const [row] = await database
    .select({
      task: qualityCaseTaskLinks,
      qualityCase: qualityCases,
      participant: qualityCaseParticipants,
    })
    .from(qualityCaseTaskLinks)
    .innerJoin(qualityCases, eq(qualityCaseTaskLinks.caseId, qualityCases.id))
    .leftJoin(
      qualityCaseParticipants,
      eq(qualityCaseTaskLinks.participantId, qualityCaseParticipants.id),
    )
    .where(
      eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(input.token)),
    )
    .limit(1);
  if (!row || !isActiveQualityCaseTaskLink(row.task))
    return {
      ok: false,
      status: 404,
      error: "This task link is unavailable or expired.",
    };
  const type = taskType(row.task.taskType);
  const action =
    input.action === "supplier_submit" ||
    input.action === "customer_accept" ||
    input.action === "request_customer_changes"
      ? input.action
      : null;
  if (
    !type ||
    !action ||
    (type === "supplier_response" && action !== "supplier_submit") ||
    (type === "customer_review" && action === "supplier_submit")
  )
    return {
      ok: false,
      status: 400,
      error: "This action is not available for the task.",
    };
  if (
    type === "supplier_response" &&
    (
      input.submissionMetadata?.supplierResponsePackage !== true ||
      !input.supplierPackageSubmission
    )
  )
    return {
      ok: false,
      status: 400,
      error: "Supplier responses must be submitted as an auditable response package.",
    };
  const customerSnapshot =
    type === "customer_review"
      ? parseCustomerReviewSnapshot(row.task.authorizedResponse)
      : null;
  if (type === "customer_review" && !customerSnapshot)
    return {
      ok: false,
      status: 404,
      error: "This customer review snapshot is unavailable.",
    };
  const response = safeText(input.response, 12000);
  const suppliedComment =
    type === "customer_review" && action === "customer_accept"
      ? ""
      : safeText(input.comment, 4000);
  const legacyRequestedFieldIds = Array.isArray(input.requestedFieldIds)
    ? input.requestedFieldIds
        .filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
        .slice(0, 30)
    : [];
  let fieldComments = normalizeCustomerFieldComments(
    input.fieldComments,
    customerSnapshot?.fieldPaths || [],
  );
  if (type === "customer_review" && action === "customer_accept")
    fieldComments = [];
  if (
    type === "customer_review" &&
    action === "request_customer_changes" &&
    !fieldComments.length &&
    suppliedComment
  ) {
    const allowed = new Set(customerSnapshot?.fieldPaths || []);
    fieldComments = legacyRequestedFieldIds
      .filter((fieldPath) => allowed.has(fieldPath))
      .map((fieldPath) => ({ fieldPath, comment: suppliedComment }));
  }
  const requestedFieldIds =
    type === "customer_review"
      ? fieldComments.map((item) => item.fieldPath)
      : legacyRequestedFieldIds;
  const comment =
    suppliedComment ||
    fieldComments
      .map((item) => `${item.fieldPath}: ${item.comment}`)
      .join("\n")
      .slice(0, 4000);
  const requestedEvidenceIds = Array.isArray(input.evidenceIds)
    ? input.evidenceIds
        .filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
        .slice(0, 30)
    : [];
  const evidenceIds =
    requestedEvidenceIds.length && row.task.participantId
      ? (
          await database
            .select({ id: qualityCaseEvidence.id })
            .from(qualityCaseEvidence)
            .where(
              and(
                eq(qualityCaseEvidence.caseId, row.qualityCase.id),
                eq(
                  qualityCaseEvidence.uploadedByParticipantId,
                  row.task.participantId,
                ),
                inArray(qualityCaseEvidence.id, requestedEvidenceIds),
              ),
            )
        ).map((evidence) => evidence.id)
      : [];
  if (type === "supplier_response" && !response)
    return {
      ok: false,
      status: 400,
      error: "Please complete the response before submitting.",
    };
  if (
    type === "customer_review" &&
    action === "request_customer_changes" &&
    !fieldComments.length
  )
    return {
      ok: false,
      status: 400,
      error: "Add a comment to at least one authorized section.",
    };
  const validation = validateQualityCaseAction(
    row.qualityCase.status as never,
    { action, actorRole: "external_guest", comment, requestedFieldIds },
  );
  if (!validation.ok)
    return { ok: false, status: 400, error: validation.error };
  const nextVersion = row.qualityCase.currentVersion + 1;
  const now = input.supplierPackageSubmission?.submittedAt || new Date();
  const customerFeedback: CustomerFeedback | null =
    type === "customer_review" && action === "request_customer_changes"
      ? {
          id: randomUUID(),
          taskId: row.task.id,
          caseVersion: nextVersion,
          customer: {
            participantId: row.participant?.id || null,
            name: row.participant?.displayName || "External customer",
            organization: row.participant?.organizationName || null,
          },
          submittedAt: now.toISOString(),
          fieldComments,
        }
      : null;
  const contentUpdate = buildExternalCaseDataUpdate({
    previousCaseData: row.qualityCase.caseData,
    taskType: type,
    action,
    response,
    comment,
    requestedFieldIds,
    now,
    customerFeedback,
  });
  const nextCase = {
    ...row.qualityCase,
    status: validation.transition.to,
    waitingOn: validation.transition.waitingOn,
    nextAction: validation.transition.nextAction,
    currentVersion: nextVersion,
    caseData: contentUpdate.caseData,
    updatedAt: now,
  };
  if (type === "supplier_response" && input.supplierPackageSubmission) {
    const packageSubmission = input.supplierPackageSubmission;
    const singleRow = sql`(select 1) as supplier_package_guard`;
    const lock = database.select({
      locked: sql<number>`pg_advisory_xact_lock(hashtextextended(${packageSubmission.sessionId}, 0))`,
    }).from(singleRow);
    const assertCurrentSubmission = database.select({
      valid: sql<number>`1 / case when exists (
        select 1
        from ${qualityCaseTaskLinks}
        inner join ${qualityCases} on ${qualityCases}.${qualityCases.id} = ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.caseId}
        inner join ${qualityCaseGuidanceSessions} on ${qualityCaseGuidanceSessions}.${qualityCaseGuidanceSessions.taskLinkId} = ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.id}
        where ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.id} = ${row.task.id}
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.tokenHash} = ${hashQualityCaseTaskToken(input.token)}
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.taskType} = 'supplier_response'
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.revokedAt} is null
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.completedAt} is null
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.expiresAt} > ${now}
          and ${qualityCases}.${qualityCases.id} = ${row.qualityCase.id}
          and ${qualityCases}.${qualityCases.status} = ${row.qualityCase.status}
          and ${qualityCaseGuidanceSessions}.${qualityCaseGuidanceSessions.id} = ${packageSubmission.sessionId}
          and (select count(*) from ${qualityCaseGuidanceAnswers} where ${qualityCaseGuidanceAnswers}.${qualityCaseGuidanceAnswers.sessionId} = ${packageSubmission.sessionId}) = ${packageSubmission.expectedLedgerCounts.answers}
          and (select count(*) from ${qualityCaseGuidanceAiRuns} where ${qualityCaseGuidanceAiRuns}.${qualityCaseGuidanceAiRuns.sessionId} = ${packageSubmission.sessionId}) = ${packageSubmission.expectedLedgerCounts.aiRuns}
          and (select count(*) from ${qualityCaseGuidanceInsights} where ${qualityCaseGuidanceInsights}.${qualityCaseGuidanceInsights.sessionId} = ${packageSubmission.sessionId}) = ${packageSubmission.expectedLedgerCounts.insights}
          and (select count(*) from ${qualityCaseGuidanceEvidenceRequirements} where ${qualityCaseGuidanceEvidenceRequirements}.${qualityCaseGuidanceEvidenceRequirements.sessionId} = ${packageSubmission.sessionId}) = ${packageSubmission.expectedLedgerCounts.evidenceRequirements}
          and (select count(*) from ${qualityCaseEvidence} where ${qualityCaseEvidence}.${qualityCaseEvidence.caseId} = ${row.qualityCase.id} and ${qualityCaseEvidence}.${qualityCaseEvidence.uploadedByParticipantId} is not distinct from ${row.task.participantId}) = ${packageSubmission.expectedLedgerCounts.evidence}
          and (select count(*) from ${qualityCaseGuidanceFieldMappings} where ${qualityCaseGuidanceFieldMappings}.${qualityCaseGuidanceFieldMappings.sessionId} = ${packageSubmission.sessionId}) = ${packageSubmission.expectedLedgerCounts.mappings}
          and not exists (
            select 1 from ${qualityCaseGuidanceConfirmations}
            where ${qualityCaseGuidanceConfirmations}.${qualityCaseGuidanceConfirmations.sessionId} = ${packageSubmission.sessionId}
              and ${qualityCaseGuidanceConfirmations}.${qualityCaseGuidanceConfirmations.confirmationType} = 'supplier_response_package'
              and ${qualityCaseGuidanceConfirmations}.${qualityCaseGuidanceConfirmations.decision} = 'submitted'
          )
      ) then 1 else 0 end`,
    }).from(singleRow);
    try {
      await database.batch([
        lock,
        assertCurrentSubmission,
        database.insert(qualityCaseGuidanceConfirmations).values(packageSubmission.confirmation),
        database.update(qualityCases).set({
          status: validation.transition.to,
          waitingOn: validation.transition.waitingOn,
          nextAction: validation.transition.nextAction,
          currentVersion: nextVersion,
          caseData: contentUpdate.caseData,
          updatedAt: now,
        }).where(and(eq(qualityCases.id, row.qualityCase.id), eq(qualityCases.status, row.qualityCase.status))),
        database.update(qualityCaseTaskLinks).set({ completedAt: now, updatedAt: now }).where(and(eq(qualityCaseTaskLinks.id, row.task.id), isNull(qualityCaseTaskLinks.completedAt))),
        database.insert(qualityCaseVersions).values({ caseId: row.qualityCase.id, version: nextVersion, snapshot: snapshot(nextCase), createdBy: null }),
        database.insert(qualityCaseActivities).values({
          caseId: row.qualityCase.id,
          version: nextVersion,
          actionType: action,
          actorRole: "supplier",
          actorOrganization: row.participant?.organizationName || null,
          comment: comment || response || null,
          requestedFieldIds,
          evidenceIds,
          diff: {
            status: { before: row.qualityCase.status, after: validation.transition.to },
            ...contentUpdate.diff,
          },
          metadata: {
            externalTask: true,
            participantId: row.participant?.id || null,
            actorName: row.participant?.displayName || "External guest",
            ...(input.submissionMetadata || {}),
          },
        }),
        database.update(qualityCaseGuidanceSessions).set({ status: "submitted", submittedAt: now, updatedAt: now }).where(and(eq(qualityCaseGuidanceSessions.id, packageSubmission.sessionId), eq(qualityCaseGuidanceSessions.taskLinkId, row.task.id))),
      ]);
      return { ok: true, value: { status: validation.transition.to } };
    } catch (error) {
      console.error(
        "Supplier response package transaction failed",
        error instanceof Error
          ? {
              name: error.name,
              code: "code" in error ? String(error.code) : undefined,
              routine: "routine" in error ? String(error.routine) : undefined,
            }
          : { name: "UnknownError" },
      );
      return {
        ok: false,
        status: 409,
        error: "The supplier package could not be committed atomically. Please retry.",
      };
    }
  }
  const singleRow = sql`(select 1) as customer_review_guard`;
  const lock = database
    .select({
      locked: sql<number>`pg_advisory_xact_lock(hashtextextended(${row.task.id}, 0))`,
    })
    .from(singleRow);
  const assertCurrentReview = database
    .select({
      valid: sql<number>`1 / case when exists (
        select 1
        from ${qualityCaseTaskLinks}
        inner join ${qualityCases} on ${qualityCases}.${qualityCases.id} = ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.caseId}
        where ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.id} = ${row.task.id}
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.tokenHash} = ${hashQualityCaseTaskToken(input.token)}
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.taskType} = 'customer_review'
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.revokedAt} is null
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.completedAt} is null
          and ${qualityCaseTaskLinks}.${qualityCaseTaskLinks.expiresAt} > ${now}
          and ${qualityCases}.${qualityCases.id} = ${row.qualityCase.id}
          and ${qualityCases}.${qualityCases.status} = ${row.qualityCase.status}
      ) then 1 else 0 end`,
    })
    .from(singleRow);
  try {
    await database.batch([
      lock,
      assertCurrentReview,
      database
        .update(qualityCases)
        .set({
          status: validation.transition.to,
          waitingOn: validation.transition.waitingOn,
          nextAction: validation.transition.nextAction,
          currentVersion: nextVersion,
          caseData: contentUpdate.caseData,
          updatedAt: now,
        })
        .where(
          and(
            eq(qualityCases.id, row.qualityCase.id),
            eq(qualityCases.status, row.qualityCase.status),
          ),
        ),
      database
        .update(qualityCaseTaskLinks)
        .set({ completedAt: now, updatedAt: now })
        .where(
          and(
            eq(qualityCaseTaskLinks.id, row.task.id),
            isNull(qualityCaseTaskLinks.completedAt),
          ),
        ),
      database.insert(qualityCaseVersions).values({
        caseId: row.qualityCase.id,
        version: nextVersion,
        snapshot: snapshot(nextCase),
        createdBy: null,
      }),
      database.insert(qualityCaseActivities).values({
        caseId: row.qualityCase.id,
        version: nextVersion,
        actionType: action,
        actorRole: "customer",
        actorOrganization: row.participant?.organizationName || null,
        comment: comment || null,
        requestedFieldIds,
        evidenceIds: [],
        diff: {
          status: {
            before: row.qualityCase.status,
            after: validation.transition.to,
          },
          ...contentUpdate.diff,
        },
        metadata: {
          externalTask: true,
          externalTaskId: row.task.id,
          participantId: row.participant?.id || null,
          actorName: row.participant?.displayName || "External customer",
          customerReviewVersion: customerSnapshot?.caseVersion || null,
          feedbackId: customerFeedback?.id || null,
          fieldComments: customerFeedback?.fieldComments || [],
        },
      }),
    ]);
  } catch (error) {
    console.error(
      "Customer review transaction failed",
      error instanceof Error
        ? {
            name: error.name,
            code: "code" in error ? String(error.code) : undefined,
            routine: "routine" in error ? String(error.routine) : undefined,
          }
        : { name: "UnknownError" },
    );
    return {
      ok: false,
      status: 409,
      error:
        "The customer decision could not be committed. Refresh the review link and try again.",
    };
  }
  return {
    ok: true,
    value: {
      status: validation.transition.to,
      ...(customerFeedback ? { feedbackId: customerFeedback.id } : {}),
    },
  };
}
