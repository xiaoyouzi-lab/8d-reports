import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { qualityCases } from "@/lib/db/schema";
import { getAccessibleUserIds } from "@/lib/report-access";
import { getUserWorkspaceRoleForReportOwner, type TeamRole } from "@/lib/report-workflow";

export interface QualityCaseAccess {
  qualityCase: typeof qualityCases.$inferSelect;
  role: TeamRole;
  canView: true;
  canEdit: boolean;
  canAssignExternalTasks: boolean;
  canManageWorkflow: boolean;
}

/**
 * Internal access follows the existing Team workspace boundary only. External
 * task links must use their own hashed-token lookup path and never call this
 * helper or inherit a user's broad workspace access.
 */
export async function getQualityCaseAccess(caseId: string, userId: string): Promise<QualityCaseAccess | null> {
  const accessibleUserIds = await getAccessibleUserIds(userId);
  const [qualityCase] = await db
    .select()
    .from(qualityCases)
    .where(and(eq(qualityCases.id, caseId), inArray(qualityCases.ownerId, accessibleUserIds)))
    .limit(1);

  if (!qualityCase) return null;

  const workspaceRole = qualityCase.ownerId === userId
    ? "owner"
    : await getUserWorkspaceRoleForReportOwner(userId, qualityCase.ownerId);
  if (!workspaceRole) return null;

  return {
    qualityCase,
    role: workspaceRole,
    canView: true,
    canEdit: workspaceRole !== "viewer",
    canAssignExternalTasks: workspaceRole === "owner",
    canManageWorkflow: workspaceRole === "owner" || workspaceRole === "editor",
  };
}
