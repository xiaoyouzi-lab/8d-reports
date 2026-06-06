import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { plans, reportActivities, reports, subscriptions, teamMembers, teamWorkspaces } from "@/lib/db/schema";
import { getAccessibleReport } from "@/lib/report-access";
import { getPlanFromName } from "@/lib/plans";
import { isActiveStatus } from "@/lib/subscription";

export const WORKFLOW_STATUSES = [
  "draft",
  "internal_review",
  "approved",
  "submitted",
  "closed",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
export type TeamRole = "owner" | "editor" | "viewer";

export const LOCKED_WORKFLOW_STATUSES = new Set<WorkflowStatus>(["approved", "submitted", "closed"]);

export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return typeof value === "string" && (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function normalizeTeamRole(value: unknown): TeamRole {
  if (value === "owner" || value === "viewer") return value;
  return "editor";
}

export function previewValue(value: unknown, maxLength = 300) {
  if (value === undefined || value === null) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function isActiveTeamSubscription(row: { status?: string | null; planName?: string | null }) {
  return isActiveStatus(row.status) && getPlanFromName(row.planName) === "team";
}

export async function getReportAccess(reportId: string, userId: string) {
  const accessible = await getAccessibleReport(reportId, userId);
  if (!accessible) return null;
  const workspaceRole = await getUserWorkspaceRoleForReportOwner(userId, accessible.userId);
  if (accessible.userId === userId) return buildAccess(accessible, workspaceRole || "owner");
  return buildAccess(accessible, workspaceRole || "viewer");
}

export async function getUserWorkspaceRole(userId: string): Promise<TeamRole | null> {
  const ownedTeams = await db
    .select({ id: teamWorkspaces.id, status: subscriptions.status, planName: plans.name })
    .from(teamWorkspaces)
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamWorkspaces.ownerId, userId));
  if (ownedTeams.some(isActiveTeamSubscription)) return "owner";

  const memberships = await db
    .select({ role: teamMembers.role, status: subscriptions.status, planName: plans.name })
    .from(teamMembers)
    .innerJoin(teamWorkspaces, eq(teamMembers.teamId, teamWorkspaces.id))
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamMembers.userId, userId));
  const activeMembership = memberships.find(isActiveTeamSubscription);
  return activeMembership ? normalizeTeamRole(activeMembership.role) : null;
}

export async function getUserWorkspaceRoleForReportOwner(userId: string, reportOwnerId: string): Promise<TeamRole | null> {
  const ownerTeams = await db
    .select({ id: teamWorkspaces.id, status: subscriptions.status, planName: plans.name })
    .from(teamWorkspaces)
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamWorkspaces.ownerId, reportOwnerId))
  const activeOwnerTeam = ownerTeams.find(isActiveTeamSubscription);

  if (activeOwnerTeam) {
    if (userId === reportOwnerId) return "owner";
    const [membership] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, activeOwnerTeam.id), eq(teamMembers.userId, userId)))
      .limit(1);
    return membership ? normalizeTeamRole(membership.role) : null;
  }

  const reportOwnerMemberships = await db
    .select({
      teamId: teamMembers.teamId,
      ownerId: teamWorkspaces.ownerId,
      status: subscriptions.status,
      planName: plans.name,
    })
    .from(teamMembers)
    .innerJoin(teamWorkspaces, eq(teamMembers.teamId, teamWorkspaces.id))
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamMembers.userId, reportOwnerId))
  const reportOwnerMembership = reportOwnerMemberships.find(isActiveTeamSubscription);

  if (!reportOwnerMembership) return null;
  if (reportOwnerMembership.ownerId === userId) return "owner";

  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, reportOwnerMembership.teamId), eq(teamMembers.userId, userId)))
    .limit(1);
  return membership ? normalizeTeamRole(membership.role) : null;
}

export function buildReportAccess(report: Pick<typeof reports.$inferSelect, "lockedAt" | "workflowStatus">, role: TeamRole) {
  const locked = Boolean(report.lockedAt) || LOCKED_WORKFLOW_STATUSES.has(report.workflowStatus as WorkflowStatus);
  return {
    role,
    locked,
    canEdit: role !== "viewer" && !locked,
    canManageWorkflow: role === "owner",
    canShare: role !== "viewer",
    canExportDraft: role !== "viewer",
  };
}

function buildAccess(report: typeof reports.$inferSelect, role: TeamRole) {
  return {
    report,
    ...buildReportAccess(report, role),
  };
}

export async function logReportActivity(input: {
  reportId: string;
  actorId?: string | null;
  actorName?: string | null;
  actionType: string;
  entityType?: string;
  entityId?: string | null;
  fieldName?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  reason?: string | null;
}) {
  await db.insert(reportActivities).values({
    reportId: input.reportId,
    actorId: input.actorId || null,
    actorName: input.actorName || null,
    actionType: input.actionType,
    entityType: input.entityType || "report",
    entityId: input.entityId || null,
    fieldName: input.fieldName || null,
    oldValuePreview: previewValue(input.oldValue),
    newValuePreview: previewValue(input.newValue),
    metadata: input.metadata || {},
    reason: input.reason || null,
  }).catch((error) => console.error("Failed to record report activity", error));
}
