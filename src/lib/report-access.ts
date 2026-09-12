import { db } from "@/lib/db";
import { reports, subscriptions, plans, teamMembers, teamWorkspaces } from "@/lib/db/schema";
import { and, eq, inArray, or, type SQL } from "drizzle-orm";
import { getPlanFromName } from "@/lib/plans";
import { isActiveStatus } from "@/lib/subscription";

export interface ReportAccessScope {
  /** User ids whose PERSONAL reports are visible. Under strict separation this is only the caller. */
  userIds: string[];
  /** Accepted team ids whose team-scoped reports are visible. */
  teamIds: string[];
}

function isActiveTeamSubscription(row: { status?: string | null; planName?: string | null }) {
  return isActiveStatus(row.status) && getPlanFromName(row.planName) === "team";
}

/**
 * Teams the user can read reports from under Option A strict separation:
 * teams the user owns with an active Team subscription, plus teams the user
 * belongs to with an ACCEPTED membership. Pending invitations grant no scope.
 */
export async function getAccessibleTeamIds(userId: string): Promise<string[]> {
  const teamIds = new Set<string>();

  const ownedTeams = await db
    .select({ teamId: teamWorkspaces.id, planName: plans.name, status: subscriptions.status })
    .from(teamWorkspaces)
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamWorkspaces.ownerId, userId));
  ownedTeams.forEach((team) => {
    if (isActiveTeamSubscription(team)) teamIds.add(team.teamId);
  });

  const memberTeams = await db
    .select({ teamId: teamWorkspaces.id, planName: plans.name, status: subscriptions.status })
    .from(teamMembers)
    .innerJoin(teamWorkspaces, eq(teamMembers.teamId, teamWorkspaces.id))
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "accepted")));
  memberTeams.forEach((team) => {
    if (isActiveTeamSubscription(team)) teamIds.add(team.teamId);
  });

  return Array.from(teamIds);
}

export async function getAccessibleReportScope(userId: string): Promise<ReportAccessScope> {
  return {
    userIds: [userId],
    teamIds: await getAccessibleTeamIds(userId),
  };
}

/**
 * The user's primary team (owned team first, then accepted membership) used to
 * scope newly created reports. Returns null when the user has no active Team
 * workspace, so the new report stays personal.
 */
export async function getPrimaryTeamId(userId: string): Promise<string | null> {
  const teamIds = await getAccessibleTeamIds(userId);
  return teamIds[0] ?? null;
}

/**
 * @deprecated Under strict separation a report is reachable when the caller
 * authored it OR it belongs to one of the caller's accepted teams. That scope
 * is expressed by getAccessibleReportScope + accessibleReportsWhere, because
 * team visibility is keyed on reports.teamId rather than the author.
 */
export async function getAccessibleUserIds(userId: string): Promise<string[]> {
  return [userId];
}

export function accessibleReportsWhere(scope: ReportAccessScope): SQL {
  const conditions: SQL[] = [inArray(reports.userId, scope.userIds)];
  if (scope.teamIds.length > 0) {
    conditions.push(inArray(reports.teamId, scope.teamIds));
  }
  return or(...conditions)!;
}

/** In-memory equivalent of accessibleReportsWhere, used by non-SQL callers and tests. */
export function reportMatchesScope(
  scope: ReportAccessScope,
  report: { userId: string; teamId?: string | null },
): boolean {
  if (scope.userIds.includes(report.userId)) return true;
  return Boolean(report.teamId && scope.teamIds.includes(report.teamId));
}

export async function getAccessibleReport(reportId: string, userId: string) {
  const scope = await getAccessibleReportScope(userId);
  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), accessibleReportsWhere(scope)))
    .limit(1);

  return report || null;
}
