import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { analyticsEvents, teamMembers, teamWorkspaces, users } from "@/lib/db/schema";
import { eq, and, ne, desc, inArray, sql } from "drizzle-orm";
import { getUserEntitlements } from "@/lib/subscription";
import { normalizeAssignableTeamRole } from "@/lib/report-workflow";

const TEAM_ACTIVITY_EVENTS = [
  "team_member_added",
  "team_member_role_changed",
  "team_member_removed",
] as const;

type TeamActivityEvent = (typeof TEAM_ACTIVITY_EVENTS)[number];

async function getOwnedTeam(userId: string) {
  return (await db
    .select()
    .from(teamWorkspaces)
    .where(eq(teamWorkspaces.ownerId, userId))
    .limit(1))[0];
}

function teamActivityMessage(eventName: string, metadata: Record<string, unknown>) {
  const email = typeof metadata.targetEmail === "string" ? metadata.targetEmail : "team member";
  const oldRole = typeof metadata.oldRole === "string" ? metadata.oldRole : null;
  const newRole = typeof metadata.newRole === "string" ? metadata.newRole : null;

  if (eventName === "team_member_added") return `Added ${email} as ${newRole || "editor"}`;
  if (eventName === "team_member_role_changed") return `Changed ${email} from ${oldRole || "-"} to ${newRole || "-"}`;
  if (eventName === "team_member_removed") return `Removed ${email}`;
  return eventName;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function logTeamActivity(input: {
  actorId: string;
  actorName?: string | null;
  teamId: string;
  eventName: TeamActivityEvent;
  targetUserId?: string | null;
  targetName?: string | null;
  targetEmail?: string | null;
  oldRole?: string | null;
  newRole?: string | null;
}) {
  await db.insert(analyticsEvents).values({
    eventName: input.eventName,
    userId: input.actorId,
    plan: "team",
    path: "/dashboard",
    metadata: {
      teamId: input.teamId,
      actorName: input.actorName || null,
      targetUserId: input.targetUserId || null,
      targetName: input.targetName || null,
      targetEmail: input.targetEmail || null,
      oldRole: input.oldRole || null,
      newRole: input.newRole || null,
    },
  }).catch((error) => console.error("Failed to record team activity", error));
}

async function getTeamActivities(teamId: string) {
  const rows = await db
    .select({
      id: analyticsEvents.id,
      eventName: analyticsEvents.eventName,
      userId: analyticsEvents.userId,
      metadata: analyticsEvents.metadata,
      createdAt: analyticsEvents.createdAt,
    })
    .from(analyticsEvents)
    .where(and(
      inArray(analyticsEvents.eventName, [...TEAM_ACTIVITY_EVENTS]),
      sql`${analyticsEvents.metadata}->>'teamId' = ${teamId}`,
    ))
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(8);

  return rows.map((row) => {
    const metadata = normalizeMetadata(row.metadata);
    return {
      id: row.id,
      eventName: row.eventName,
      actorName: typeof metadata.actorName === "string" ? metadata.actorName : "Team owner",
      message: teamActivityMessage(row.eventName, metadata),
      createdAt: row.createdAt,
    };
  });
}

async function requireActiveTeamOwner(userId: string) {
  const entitlements = await getUserEntitlements(userId);
  if (entitlements.plan !== "team") {
    return { error: NextResponse.json({ error: "Team management requires the Team plan" }, { status: 403 }) };
  }

  return {
    entitlements,
    team: await getOwnedTeam(userId),
  };
}

async function getTeamWithMembers(userId: string) {
  const owned = await getOwnedTeam(userId);
  if (owned) {
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        name: users.name,
        email: users.email,
        createdAt: teamMembers.createdAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, owned.id));
    return { team: owned, members, activities: await getTeamActivities(owned.id), role: "owner" as const };
  }

  const memberRow = (await db
    .select({
      team: teamWorkspaces,
      memberRole: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teamWorkspaces, eq(teamMembers.teamId, teamWorkspaces.id))
    .where(eq(teamMembers.userId, userId))
    .limit(1))[0];

  if (!memberRow) return null;

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      name: users.name,
      email: users.email,
      createdAt: teamMembers.createdAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, memberRow.team.id));

  return { team: memberRow.team, members, activities: await getTeamActivities(memberRow.team.id), role: memberRow.memberRole };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const entitlements = await getUserEntitlements(user.id);
  const team = await getTeamWithMembers(user.id);

  return NextResponse.json({
    plan: entitlements.plan,
    maxSeats: entitlements.teamSeats,
    team,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const ownerAccess = await requireActiveTeamOwner(user.id);
  if ("error" in ownerAccess) return ownerAccess.error;

  const { entitlements } = ownerAccess;
  let team = ownerAccess.team;
  if (!team) {
    const [created] = await db
      .insert(teamWorkspaces)
      .values({ ownerId: user.id, name: "8D Reports Team", maxSeats: entitlements.teamSeats })
      .returning();
    team = created;
    await db.insert(teamMembers).values({ teamId: team.id, userId: user.id, role: "owner" }).catch(() => {});
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = normalizeAssignableTeamRole(body.role ?? "editor");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Role must be editor or viewer" }, { status: 400 });
  }

  const memberRows = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, team.id));

  if (memberRows.length >= entitlements.teamSeats) {
    return NextResponse.json({ error: `Team plan includes ${entitlements.teamSeats} seats` }, { status: 403 });
  }

  const invited = (await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1))[0];

  if (!invited) {
    return NextResponse.json({ error: "This email is not registered yet. Ask the user to sign up first, then add them." }, { status: 404 });
  }

  const existing = memberRows.find((member) => member.userId === invited.id);
  if (!existing) {
    await db.insert(teamMembers).values({ teamId: team.id, userId: invited.id, role });
    await logTeamActivity({
      actorId: user.id,
      actorName: user.name,
      teamId: team.id,
      eventName: "team_member_added",
      targetUserId: invited.id,
      targetName: invited.name,
      targetEmail: invited.email,
      newRole: role,
    });
  }

  return NextResponse.json(await getTeamWithMembers(user.id), { status: existing ? 200 : 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const ownerAccess = await requireActiveTeamOwner(user.id);
  if ("error" in ownerAccess) return ownerAccess.error;
  const team = ownerAccess.team;
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const role = normalizeAssignableTeamRole(body.role);
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });
  if (!role) return NextResponse.json({ error: "Role must be editor or viewer" }, { status: 400 });

  const [target] = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, team.id), ne(teamMembers.userId, user.id)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (target.role !== role) {
    await db.update(teamMembers).set({ role }).where(eq(teamMembers.id, memberId));
    await logTeamActivity({
      actorId: user.id,
      actorName: user.name,
      teamId: team.id,
      eventName: "team_member_role_changed",
      targetUserId: target.userId,
      targetName: target.name,
      targetEmail: target.email,
      oldRole: target.role,
      newRole: role,
    });
  }

  return NextResponse.json(await getTeamWithMembers(user.id));
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const ownerAccess = await requireActiveTeamOwner(user.id);
  if ("error" in ownerAccess) return ownerAccess.error;
  const team = ownerAccess.team;
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const [target] = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, team.id), ne(teamMembers.userId, user.id)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await db
    .delete(teamMembers)
    .where(eq(teamMembers.id, memberId));

  await logTeamActivity({
    actorId: user.id,
    actorName: user.name,
    teamId: team.id,
    eventName: "team_member_removed",
    targetUserId: target.userId,
    targetName: target.name,
    targetEmail: target.email,
    oldRole: target.role,
  });

  return NextResponse.json(await getTeamWithMembers(user.id));
}
