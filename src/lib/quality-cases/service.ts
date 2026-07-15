import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseActivities,
  qualityCaseEvidence,
  qualityCaseParticipants,
  qualityCases,
  qualityCaseTaskLinks,
  qualityCaseVersions,
  users,
} from "@/lib/db/schema";
import { getAccessibleUserIds } from "@/lib/report-access";
import {
  getUserWorkspaceRole,
  getUserWorkspaceRoleForReportOwner,
  type TeamRole,
} from "@/lib/report-workflow";
import {
  QUALITY_CASE_STATUSES,
  validateQualityCaseAction,
  type QualityCaseAction,
  type QualityCaseOutputType,
  type QualityCaseStatus,
} from "@/lib/quality-cases/contract";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";

const OUTPUT_TYPES: readonly QualityCaseOutputType[] = [
  "8d",
  "scar",
  "car",
  "capa",
  "ncr_response",
  "corrective_action_report",
];
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type QualityCasePriority = (typeof PRIORITIES)[number];

export interface QualityCaseActor {
  id: string;
  name?: string | null;
}

export interface CreateQualityCaseInput {
  title: unknown;
  coordinatorOrganization: unknown;
  outputType?: unknown;
  priority?: unknown;
  dueAt?: unknown;
  caseData?: unknown;
}

export type QualityCaseServiceResult<T> =
  { ok: true; value: T } | { ok: false; status: number; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeQualityCaseTitle(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function normalizeCoordinatorOrganization(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function normalizeQualityCaseOutputType(
  value: unknown,
): QualityCaseOutputType {
  return typeof value === "string" &&
    OUTPUT_TYPES.includes(value as QualityCaseOutputType)
    ? (value as QualityCaseOutputType)
    : "8d";
}

export function normalizeQualityCasePriority(
  value: unknown,
): QualityCasePriority {
  return typeof value === "string" &&
    PRIORITIES.includes(value as QualityCasePriority)
    ? (value as QualityCasePriority)
    : "medium";
}

export function normalizeQualityCaseDueAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function summarizeQualityCaseQueues(
  cases: Array<{
    status: string;
    waitingOn: string;
    dueAt: Date | null;
  }>,
  now = new Date(),
) {
  const summary = {
    awaitingInternalReview: 0,
    waitingForSupplier: 0,
    waitingForCustomer: 0,
    returned: 0,
    dueSoon: 0,
    overdue: 0,
    effectivenessVerification: 0,
    closed: 0,
  };
  const dueSoonAt = now.getTime() + 3 * 24 * 60 * 60 * 1000;

  for (const qualityCase of cases) {
    if (qualityCase.status === "closed") summary.closed += 1;
    if (["effectiveness_verification", "verification_planning", "verification_in_progress", "verification_submitted", "internal_verification_review", "verified_effective"].includes(qualityCase.status))
      summary.effectivenessVerification += 1;
    if (
      qualityCase.status === "changes_requested_from_supplier" ||
      qualityCase.status === "changes_requested_by_customer"
    )
      summary.returned += 1;
    if (qualityCase.waitingOn === "supplier") summary.waitingForSupplier += 1;
    if (qualityCase.waitingOn === "customer") summary.waitingForCustomer += 1;
    if (
      qualityCase.waitingOn === "internal" &&
      qualityCase.status !== "draft" &&
      qualityCase.status !== "closed"
    )
      summary.awaitingInternalReview += 1;
    if (!qualityCase.dueAt || qualityCase.status === "closed") continue;
    const dueTime = qualityCase.dueAt.getTime();
    if (dueTime < now.getTime()) summary.overdue += 1;
    else if (dueTime <= dueSoonAt) summary.dueSoon += 1;
  }
  return summary;
}

function qualityCaseSnapshot(qualityCase: typeof qualityCases.$inferSelect) {
  return {
    title: qualityCase.title,
    status: qualityCase.status,
    outputType: qualityCase.outputType,
    priority: qualityCase.priority,
    waitingOn: qualityCase.waitingOn,
    nextAction: qualityCase.nextAction,
    assigneeUserId: qualityCase.assigneeUserId,
    dueAt: qualityCase.dueAt?.toISOString() || null,
    caseData: qualityCase.caseData,
  };
}

export function canBeQualityCaseAssignee(role: TeamRole | null) {
  return role === "owner" || role === "editor";
}

async function ensureInternalQualityCaseParticipant(input: {
  caseId: string;
  actor: QualityCaseActor;
}) {
  const [existing] = await db
    .select({ organizationName: qualityCaseParticipants.organizationName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, input.caseId),
        eq(qualityCaseParticipants.userId, input.actor.id),
        eq(qualityCaseParticipants.isInternal, true),
      ),
    )
    .limit(1);
  if (existing?.organizationName) return existing.organizationName;

  const [coordinator] = await db
    .select({ organizationName: qualityCaseParticipants.organizationName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, input.caseId),
        eq(qualityCaseParticipants.role, "coordinator"),
        eq(qualityCaseParticipants.isInternal, true),
      ),
    )
    .limit(1);
  if (!coordinator?.organizationName) return null;

  await db.insert(qualityCaseParticipants).values({
    caseId: input.caseId,
    userId: input.actor.id,
    role: "internal_member",
    displayName: input.actor.name?.trim() || "Internal member",
    organizationName: coordinator.organizationName,
    isInternal: true,
  });
  return coordinator.organizationName;
}

export async function getQualityCaseAssignableMembers(caseId: string, userId: string) {
  const access = await getQualityCaseAccess(caseId, userId);
  if (!access || !access.canManageWorkflow) return null;
  const accessibleIds = await getAccessibleUserIds(access.qualityCase.ownerId);
  const candidates = await Promise.all(
    accessibleIds.map(async (candidateId) => ({
      id: candidateId,
      role:
        candidateId === access.qualityCase.ownerId
          ? "owner"
          : await getUserWorkspaceRoleForReportOwner(
              candidateId,
              access.qualityCase.ownerId,
            ),
    })),
  );
  const assignableIds = candidates
    .filter((candidate) => canBeQualityCaseAssignee(candidate.role))
    .map((candidate) => candidate.id);
  if (!assignableIds.length) return [];
  return db
    .select({ userId: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, assignableIds));
}

export async function assignQualityCase(input: {
  caseId: string;
  actor: QualityCaseActor;
  assigneeUserId: unknown;
}): Promise<QualityCaseServiceResult<typeof qualityCases.$inferSelect>> {
  const assigneeUserId =
    typeof input.assigneeUserId === "string" ? input.assigneeUserId.trim() : "";
  if (!assigneeUserId)
    return { ok: false, status: 400, error: "An internal assignee is required." };
  const access = await getQualityCaseAccess(input.caseId, input.actor.id);
  if (!access)
    return { ok: false, status: 404, error: "Quality Case not found." };
  if (!access.canManageWorkflow)
    return {
      ok: false,
      status: 403,
      error: "You do not have permission to assign this case.",
    };
  const assignees = await getQualityCaseAssignableMembers(input.caseId, input.actor.id);
  if (!assignees?.some((member) => member.userId === assigneeUserId))
    return {
      ok: false,
      status: 400,
      error: "The selected assignee is not an active internal editor.",
    };
  if (access.qualityCase.assigneeUserId === assigneeUserId)
    return { ok: true, value: access.qualityCase };

  const actorOrganization = await ensureInternalQualityCaseParticipant({
    caseId: input.caseId,
    actor: input.actor,
  });
  if (!actorOrganization)
    return {
      ok: false,
      status: 403,
      error: "A coordinator organization is required before assigning this case.",
    };
  const nextVersion = access.qualityCase.currentVersion + 1;
  const [updated] = await db
    .update(qualityCases)
    .set({
      assigneeUserId,
      currentVersion: nextVersion,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(qualityCases.id, input.caseId),
        eq(qualityCases.currentVersion, access.qualityCase.currentVersion),
      ),
    )
    .returning();
  if (!updated)
    return {
      ok: false,
      status: 409,
      error: "This case changed before the assignee was saved. Refresh and try again.",
    };
  await db.insert(qualityCaseVersions).values({
    caseId: updated.id,
    version: nextVersion,
    snapshot: qualityCaseSnapshot(updated),
    createdBy: input.actor.id,
  });
  await db.insert(qualityCaseActivities).values({
    caseId: updated.id,
    version: nextVersion,
    actionType: "assignee_changed",
    actorId: input.actor.id,
    actorRole: access.role === "owner" ? "coordinator" : "internal_member",
    actorOrganization,
    diff: {
      assigneeUserId: {
        before: access.qualityCase.assigneeUserId || access.qualityCase.ownerId,
        after: assigneeUserId,
      },
    },
  });
  return { ok: true, value: updated };
}

export async function createQualityCase(
  actor: QualityCaseActor,
  input: CreateQualityCaseInput,
): Promise<QualityCaseServiceResult<typeof qualityCases.$inferSelect>> {
  const title = normalizeQualityCaseTitle(input.title);
  const coordinatorOrganization = normalizeCoordinatorOrganization(
    input.coordinatorOrganization,
  );
  if (!title)
    return { ok: false, status: 400, error: "Case title is required." };
  if (!coordinatorOrganization)
    return {
      ok: false,
      status: 400,
      error: "Coordinator organization is required.",
    };

  const workspaceRole = await getUserWorkspaceRole(actor.id);
  if (workspaceRole === "viewer") {
    return {
      ok: false,
      status: 403,
      error: "Viewers cannot create Quality Cases.",
    };
  }

  const outputType = normalizeQualityCaseOutputType(input.outputType);
  const priority = normalizeQualityCasePriority(input.priority);
  const dueAt = normalizeQualityCaseDueAt(input.dueAt);
  const caseData = isPlainObject(input.caseData) ? input.caseData : {};

  try {
    const [qualityCase] = await db
      .insert(qualityCases)
      .values({
        ownerId: actor.id,
        assigneeUserId: actor.id,
        title,
        outputType,
        priority,
        waitingOn: "internal",
        dueAt,
        caseData,
      })
      .returning();

    await db.insert(qualityCaseParticipants).values({
      caseId: qualityCase.id,
      userId: actor.id,
      role: "coordinator",
      displayName: actor.name?.trim() || "Coordinator",
      organizationName: coordinatorOrganization,
      isInternal: true,
    });
    await db.insert(qualityCaseVersions).values({
      caseId: qualityCase.id,
      version: qualityCase.currentVersion,
      snapshot: qualityCaseSnapshot(qualityCase),
      createdBy: actor.id,
    });
    await db.insert(qualityCaseActivities).values({
      caseId: qualityCase.id,
      version: qualityCase.currentVersion,
      actionType: "case_created",
      actorId: actor.id,
      actorRole: "coordinator",
      actorOrganization: coordinatorOrganization,
      metadata: { outputType, priority },
    });
    return { ok: true, value: qualityCase };
  } catch (error) {
    console.error("Quality Case creation failed", error);
    return {
      ok: false,
      status: 503,
      error:
        "Quality Cases are temporarily unavailable. Please try again later.",
    };
  }
}

export async function listQualityCases(userId: string) {
  const accessibleUserIds = await getAccessibleUserIds(userId);
  const cases = await db
    .select({
      id: qualityCases.id,
      title: qualityCases.title,
      status: qualityCases.status,
      outputType: qualityCases.outputType,
      priority: qualityCases.priority,
      waitingOn: qualityCases.waitingOn,
      nextAction: qualityCases.nextAction,
      assigneeUserId: qualityCases.assigneeUserId,
      dueAt: qualityCases.dueAt,
      currentVersion: qualityCases.currentVersion,
      createdAt: qualityCases.createdAt,
      updatedAt: qualityCases.updatedAt,
    })
    .from(qualityCases)
    .where(inArray(qualityCases.ownerId, accessibleUserIds))
    .orderBy(desc(qualityCases.updatedAt));
  return { cases, summary: summarizeQualityCaseQueues(cases) };
}

export async function getQualityCaseDetail(caseId: string, userId: string) {
  const access = await getQualityCaseAccess(caseId, userId);
  if (!access) return null;
  const [participants, activities, evidence, tasks, assignee, assignees] = await Promise.all([
    db
      .select({
        id: qualityCaseParticipants.id,
        role: qualityCaseParticipants.role,
        displayName: qualityCaseParticipants.displayName,
        organizationName: qualityCaseParticipants.organizationName,
        isInternal: qualityCaseParticipants.isInternal,
        createdAt: qualityCaseParticipants.createdAt,
      })
      .from(qualityCaseParticipants)
      .where(eq(qualityCaseParticipants.caseId, caseId)),
    db
      .select({
        id: qualityCaseActivities.id,
        version: qualityCaseActivities.version,
        actionType: qualityCaseActivities.actionType,
        actorId: qualityCaseActivities.actorId,
        actorName: users.name,
        actorEmail: users.email,
        actorRole: qualityCaseActivities.actorRole,
        actorOrganization: qualityCaseActivities.actorOrganization,
        comment: qualityCaseActivities.comment,
        requestedFieldIds: qualityCaseActivities.requestedFieldIds,
        dueAt: qualityCaseActivities.dueAt,
        diff: qualityCaseActivities.diff,
        evidenceIds: qualityCaseActivities.evidenceIds,
        metadata: qualityCaseActivities.metadata,
        createdAt: qualityCaseActivities.createdAt,
      })
      .from(qualityCaseActivities)
      .leftJoin(users, eq(qualityCaseActivities.actorId, users.id))
      .where(eq(qualityCaseActivities.caseId, caseId))
      .orderBy(desc(qualityCaseActivities.createdAt)),
    db
      .select({
        id: qualityCaseEvidence.id,
        filename: qualityCaseEvidence.filename,
        mimeType: qualityCaseEvidence.mimeType,
        fileSize: qualityCaseEvidence.fileSize,
        visibility: qualityCaseEvidence.visibility,
        createdAt: qualityCaseEvidence.createdAt,
      })
      .from(qualityCaseEvidence)
      .where(eq(qualityCaseEvidence.caseId, caseId))
      .orderBy(desc(qualityCaseEvidence.createdAt)),
    db
      .select({
        id: qualityCaseTaskLinks.id,
        taskType: qualityCaseTaskLinks.taskType,
        expiresAt: qualityCaseTaskLinks.expiresAt,
        revokedAt: qualityCaseTaskLinks.revokedAt,
        completedAt: qualityCaseTaskLinks.completedAt,
        createdAt: qualityCaseTaskLinks.createdAt,
        participantName: qualityCaseParticipants.displayName,
        participantOrganization: qualityCaseParticipants.organizationName,
      })
      .from(qualityCaseTaskLinks)
      .leftJoin(
        qualityCaseParticipants,
        eq(qualityCaseTaskLinks.participantId, qualityCaseParticipants.id),
      )
      .where(eq(qualityCaseTaskLinks.caseId, caseId))
      .orderBy(desc(qualityCaseTaskLinks.createdAt)),
    db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, access.qualityCase.assigneeUserId || access.qualityCase.ownerId))
      .limit(1),
    getQualityCaseAssignableMembers(caseId, userId),
  ]);
  return {
    ...access,
    participants,
    activities,
    evidence,
    tasks,
    assignee: assignee[0]
      ? {
          userId: assignee[0].userId,
          displayName: assignee[0].name || assignee[0].email || "Coordinator",
        }
      : null,
    assignees: (assignees || []).map((member) => ({
      userId: member.userId,
      displayName: member.name || member.email || "Internal member",
    })),
  };
}

export async function transitionQualityCase(input: {
  caseId: string;
  actor: QualityCaseActor;
  action: QualityCaseAction;
  comment?: unknown;
  requestedFieldIds?: unknown;
  newDueAt?: unknown;
  evidenceIds?: unknown;
}): Promise<QualityCaseServiceResult<typeof qualityCases.$inferSelect>> {
  const access = await getQualityCaseAccess(input.caseId, input.actor.id);
  if (!access)
    return { ok: false, status: 404, error: "Quality Case not found." };
  if (!access.canManageWorkflow)
    return {
      ok: false,
      status: 403,
      error: "You do not have permission to update this case workflow.",
    };

  const actorRole = access.role === "owner" ? "coordinator" : "internal_member";
  const requestedFieldIds = Array.isArray(input.requestedFieldIds)
    ? input.requestedFieldIds
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
        .slice(0, 30)
    : [];
  const evidenceIds = Array.isArray(input.evidenceIds)
    ? input.evidenceIds
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
        .slice(0, 50)
    : [];
  const comment =
    typeof input.comment === "string"
      ? input.comment.trim().slice(0, 4000)
      : "";
  const newDueAt = normalizeQualityCaseDueAt(input.newDueAt);
  const validation = validateQualityCaseAction(
    access.qualityCase.status as QualityCaseStatus,
    {
      action: input.action,
      actorRole,
      comment,
      requestedFieldIds,
      newDueAt,
      evidenceIds,
    },
  );
  if (!validation.ok)
    return { ok: false, status: 400, error: validation.error };

  const actorOrganization = await ensureInternalQualityCaseParticipant({
    caseId: input.caseId,
    actor: input.actor,
  });
  if (!actorOrganization) {
    return {
      ok: false,
      status: 403,
      error:
        "Add the acting internal member to this case before changing its workflow.",
    };
  }

  const nextVersion = access.qualityCase.currentVersion + 1;
  const [updated] = await db
    .update(qualityCases)
    .set({
      status: validation.transition.to,
      waitingOn: validation.transition.waitingOn,
      nextAction: validation.transition.nextAction,
      dueAt: newDueAt || access.qualityCase.dueAt,
      currentVersion: nextVersion,
      closedAt: validation.transition.to === "closed" ? new Date() : null,
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
        "This case changed before your action was saved. Refresh and try again.",
    };

  const diff = {
    status: { before: access.qualityCase.status, after: updated.status },
    waitingOn: {
      before: access.qualityCase.waitingOn,
      after: updated.waitingOn,
    },
    dueAt: {
      before: access.qualityCase.dueAt?.toISOString() || null,
      after: updated.dueAt?.toISOString() || null,
    },
  };
  await db.insert(qualityCaseVersions).values({
    caseId: updated.id,
    version: nextVersion,
    snapshot: qualityCaseSnapshot(updated),
    createdBy: input.actor.id,
  });
  await db.insert(qualityCaseActivities).values({
    caseId: updated.id,
    version: nextVersion,
    actionType: input.action,
    actorId: input.actor.id,
    actorRole,
      actorOrganization,
    comment: comment || null,
    requestedFieldIds,
    dueAt: updated.dueAt,
    diff,
    evidenceIds,
  });
  return { ok: true, value: updated };
}

export function isQualityCaseOutputType(
  value: unknown,
): value is QualityCaseOutputType {
  return (
    typeof value === "string" &&
    OUTPUT_TYPES.includes(value as QualityCaseOutputType)
  );
}

export function isQualityCaseAction(
  value: unknown,
): value is QualityCaseAction {
  return (
    typeof value === "string" &&
    [
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
    ].includes(value)
  );
}

export function isPersistedQualityCaseStatus(
  value: unknown,
): value is QualityCaseStatus {
  return (
    typeof value === "string" &&
    QUALITY_CASE_STATUSES.includes(value as QualityCaseStatus)
  );
}
