import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { analyticsEvents, teamMembers, teamWorkspaces, users } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getUserEntitlements } from "@/lib/subscription";
import { normalizeAssignableTeamRole } from "@/lib/report-workflow";
import {
  createInviteToken,
  normalizeInviteEmail,
  TEAM_INVITE_TTL_DAYS,
} from "@/lib/team-invitations";
import { sendTeamInvitationEmail } from "@/lib/email";

const TEAM_ACTIVITY_EVENTS = [
  "team_member_invited",
  "team_member_added",
  "team_member_role_changed",
  "team_member_removed",
] as const;

type TeamActivityEvent = (typeof TEAM_ACTIVITY_EVENTS)[number];

const teamMemberSelection = {
  id: teamMembers.id,
  userId: teamMembers.userId,
  role: teamMembers.role,
  status: teamMembers.status,
  acceptedAt: teamMembers.acceptedAt,
  invitedEmail: teamMembers.invitedEmail,
  name: users.name,
  email: users.email,
  createdAt: teamMembers.createdAt,
};

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

  if (eventName === "team_member_invited") return `Invited ${email} as ${newRole || "editor"}`;
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
      .select(teamMemberSelection)
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
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
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "accepted")))
    .limit(1))[0];

  if (!memberRow) return null;

  // Non-owner members only see accepted teammates; pending invites are an
  // owner management concern and can carry an unregistered email address.
  const members = await db
    .select(teamMemberSelection)
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, memberRow.team.id), eq(teamMembers.status, "accepted")));

  return { team: memberRow.team, members, activities: await getTeamActivities(memberRow.team.id), role: memberRow.memberRole };
}

async function sendInvitationEmail(
  req: NextRequest,
  input: { to: string; teamName: string; inviterName: string; token: string },
) {
  const origin = req.headers.get("origin") || process.env.BETTER_AUTH_URL || "https://8d-reports.com";
  const acceptUrl = `${origin}/login?callbackUrl=${encodeURIComponent(`/team/accept?token=${input.token}`)}`;
  try {
    await sendTeamInvitationEmail({
      to: input.to,
      teamName: input.teamName,
      inviterName: input.inviterName,
      acceptUrl,
      expiresInDays: TEAM_INVITE_TTL_DAYS,
    });
    return true;
  } catch (error) {
    // Best-effort: the pending row and its token remain available for resend.
    console.error("Failed to send team invitation email", error);
    return false;
  }
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
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: "owner",
      status: "accepted",
      acceptedAt: new Date(),
    }).catch(() => {});
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeInviteEmail(body.email);
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

  const invited = (await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1))[0];

  const existing = memberRows.find((member) =>
    (invited && member.userId === invited.id)
    || (member.invitedEmail && normalizeInviteEmail(member.invitedEmail) === email)
  );

  // Already accepted: nothing to invite, do not create a duplicate membership.
  if (existing && existing.status === "accepted") {
    return NextResponse.json(await getTeamWithMembers(user.id), { status: 200 });
  }

  if (!existing && memberRows.length >= entitlements.teamSeats) {
    return NextResponse.json({ error: `Team plan includes ${entitlements.teamSeats} seats` }, { status: 403 });
  }

  const { token, tokenHash, expiresAt } = createInviteToken();

  if (existing) {
    // Resend / refresh an existing pending invitation.
    await db
      .update(teamMembers)
      .set({
        userId: invited?.id ?? existing.userId,
        invitedEmail: email,
        role,
        status: "pending",
        acceptedAt: null,
        inviteTokenHash: tokenHash,
        inviteExpiresAt: expiresAt,
      })
      .where(eq(teamMembers.id, existing.id));
  } else {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: invited?.id ?? null,
      invitedEmail: email,
      role,
      status: "pending",
      inviteTokenHash: tokenHash,
      inviteExpiresAt: expiresAt,
    });
  }

  await logTeamActivity({
    actorId: user.id,
    actorName: user.name,
    teamId: team.id,
    eventName: "team_member_invited",
    targetUserId: invited?.id ?? null,
    targetName: invited?.name ?? null,
    targetEmail: email,
    newRole: role,
  });

  await sendInvitationEmail(req, {
    to: email,
    teamName: team.name,
    inviterName: user.name,
    token,
  });

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
      invitedEmail: teamMembers.invitedEmail,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, team.id)))
    .limit(1);
  if (!target || target.role === "owner" || target.userId === user.id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role !== role) {
    await db.update(teamMembers).set({ role }).where(eq(teamMembers.id, memberId));
    await logTeamActivity({
      actorId: user.id,
      actorName: user.name,
      teamId: team.id,
      eventName: "team_member_role_changed",
      targetUserId: target.userId,
      targetName: target.name,
      targetEmail: target.email || target.invitedEmail,
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
      invitedEmail: teamMembers.invitedEmail,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, team.id)))
    .limit(1);
  if (!target || target.role === "owner" || target.userId === user.id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Removing a member or revoking a pending invite deletes the membership row,
  // which is exactly what removes their team scope.
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
    targetEmail: target.email || target.invitedEmail,
    oldRole: target.role,
  });

  return NextResponse.json(await getTeamWithMembers(user.id));
}
