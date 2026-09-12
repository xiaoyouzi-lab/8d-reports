import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { configureSmokeDatabase } from "./smoke-safety";

async function main() {
  const summary = configureSmokeDatabase();
  console.log("target:", summary.databaseNameHint, summary.hostSuffix);

  const { db } = await import("@/lib/db");
  const {
    getAccessibleReportScope,
    getAccessibleReport,
    reportMatchesScope,
  } = await import("@/lib/report-access");
  const { users, plans, subscriptions, teamWorkspaces, teamMembers, reports } = await import("@/lib/db/schema");

  const ts = Date.now();
  const ownerId = "smoke-owner-" + ts;
  const memberId = "smoke-member-" + ts;
  const outsiderId = "smoke-outsider-" + ts;
  const ownerBId = "smoke-ownerb-" + ts;

  await db.insert(users).values([
    { id: ownerId, email: ownerId + "@example.test", name: "Owner", emailVerified: true },
    { id: memberId, email: memberId + "@example.test", name: "Member", emailVerified: true },
    { id: outsiderId, email: outsiderId + "@example.test", name: "Outsider", emailVerified: true },
    { id: ownerBId, email: ownerBId + "@example.test", name: "Owner B", emailVerified: true },
  ]);

  const [planA] = await db.insert(plans).values({ creemProductId: "prod_team_a_" + ts, name: "Team Plan A", maxTeamMembers: 5 }).returning();
  const [planB] = await db.insert(plans).values({ creemProductId: "prod_team_b_" + ts, name: "Team Plan B", maxTeamMembers: 5 }).returning();
  await db.insert(subscriptions).values([
    { userId: ownerId, planId: planA.id, status: "active" },
    { userId: ownerBId, planId: planB.id, status: "active" },
  ]);

  const [teamA] = await db.insert(teamWorkspaces).values({ ownerId, name: "Team A" }).returning();
  const [teamB] = await db.insert(teamWorkspaces).values({ ownerId: ownerBId, name: "Team B" }).returning();
  await db.insert(teamMembers).values([
    { teamId: teamA.id, userId: ownerId, role: "owner", status: "accepted", acceptedAt: new Date() },
    { teamId: teamA.id, userId: memberId, role: "editor", status: "accepted", acceptedAt: new Date() },
    { teamId: teamA.id, userId: outsiderId, invitedEmail: outsiderId + "@example.test", role: "editor", status: "pending", inviteTokenHash: "hash-" + ts, inviteExpiresAt: new Date(Date.now() + 86400000) },
    { teamId: teamB.id, userId: ownerBId, role: "owner", status: "accepted", acceptedAt: new Date() },
  ]);

  const [personal] = await db.insert(reports).values({ userId: memberId, title: "Member personal", data: {} }).returning();
  const [teamARecord] = await db.insert(reports).values({ userId: memberId, teamId: teamA.id, title: "Team A report", data: {} }).returning();
  const [teamBRecord] = await db.insert(reports).values({ userId: ownerBId, teamId: teamB.id, title: "Team B report", data: {} }).returning();

  const ownerScope = await getAccessibleReportScope(ownerId);
  const memberScope = await getAccessibleReportScope(memberId);
  const outsiderScope = await getAccessibleReportScope(outsiderId);

  assert.ok(ownerScope.teamIds.includes(teamA.id), "owner A must have team A scope");
  assert.equal(ownerScope.teamIds.includes(teamB.id), false, "owner A must not have team B scope");
  assert.ok(memberScope.teamIds.includes(teamA.id), "accepted member must have team A scope");
  assert.equal(outsiderScope.teamIds.length, 0, "pending outsider must have no team scope");

  assert.ok(await getAccessibleReport(teamARecord.id, ownerId), "owner must read team A report");
  assert.equal(await getAccessibleReport(personal.id, ownerId), null, "owner must NOT read member pre-join personal report");
  assert.ok(await getAccessibleReport(personal.id, memberId), "member must read own personal report");
  assert.equal(await getAccessibleReport(teamARecord.id, outsiderId), null, "pending outsider must not read team A report");
  assert.equal(await getAccessibleReport(teamBRecord.id, ownerId), null, "owner A must not read team B report");
  assert.equal(await getAccessibleReport(teamARecord.id, ownerBId), null, "owner B must not read team A report");

  assert.equal(reportMatchesScope(ownerScope, { userId: memberId, teamId: null }), false, "pure predicate: pre-join personal not visible");
  assert.equal(reportMatchesScope(ownerScope, { userId: memberId, teamId: teamA.id }), true, "pure predicate: team report visible");

  const [pendingRow] = await db.select({ id: teamMembers.id }).from(teamMembers).where(eq(teamMembers.userId, outsiderId)).limit(1);
  await db.update(teamMembers)
    .set({ status: "accepted", acceptedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null })
    .where(eq(teamMembers.id, pendingRow.id));
  const outsiderAfter = await getAccessibleReportScope(outsiderId);
  assert.ok(outsiderAfter.teamIds.includes(teamA.id), "after accepting, outsider must have team A scope");
  assert.ok(await getAccessibleReport(teamARecord.id, outsiderId), "after accepting, outsider must read team A report");
  assert.equal(await getAccessibleReport(personal.id, outsiderId), null, "after accepting, outsider must still NOT read member personal report");

  await db.delete(reports).where(inArray(reports.id, [personal.id, teamARecord.id, teamBRecord.id]));
  await db.delete(users).where(inArray(users.id, [ownerId, memberId, outsiderId, ownerBId]));
  await db.delete(plans).where(inArray(plans.id, [planA.id, planB.id]));

  console.log("TEAM_ISOLATION_SMOKE_PASS");
}

main().catch((error) => {
  console.error("TEAM_ISOLATION_SMOKE_FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
