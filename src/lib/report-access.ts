import { db } from "@/lib/db";
import { reports, subscriptions, plans, teamMembers, teamWorkspaces } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getPlanFromName } from "@/lib/plans";
import { isActiveStatus } from "@/lib/subscription";

export async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const ids = new Set<string>([userId]);

  const ownedTeam = await db
    .select({ teamId: teamWorkspaces.id, planName: plans.name, status: subscriptions.status })
    .from(teamWorkspaces)
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamWorkspaces.ownerId, userId));

  const activeOwnedTeam = ownedTeam.find((team) =>
    isActiveStatus(team.status) && getPlanFromName(team.planName) === "team"
  );
  if (activeOwnedTeam) {
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, activeOwnedTeam.teamId));
    members.forEach((member) => ids.add(member.userId));
  }

  const memberTeams = await db
    .select({ teamId: teamWorkspaces.id, ownerId: teamWorkspaces.ownerId, planName: plans.name, status: subscriptions.status })
    .from(teamMembers)
    .innerJoin(teamWorkspaces, eq(teamMembers.teamId, teamWorkspaces.id))
    .innerJoin(subscriptions, eq(subscriptions.userId, teamWorkspaces.ownerId))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(teamMembers.userId, userId));

  const activeMemberTeamIds: string[] = [];
  memberTeams.forEach((team) => {
    if (!isActiveStatus(team.status) || getPlanFromName(team.planName) !== "team") return;
    ids.add(team.ownerId);
    activeMemberTeamIds.push(team.teamId);
  });

  if (activeMemberTeamIds.length > 0) {
    const peers = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(inArray(teamMembers.teamId, activeMemberTeamIds));
    peers.forEach((peer) => ids.add(peer.userId));
  }

  return Array.from(ids);
}

export async function getAccessibleReport(reportId: string, userId: string) {
  const accessibleUserIds = await getAccessibleUserIds(userId);
  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), inArray(reports.userId, accessibleUserIds)))
    .limit(1);

  return report || null;
}
