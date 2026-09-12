import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { teamMembers, teamWorkspaces } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { hashInviteToken, isInviteExpired, normalizeInviteEmail } from "@/lib/team-invitations";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
  }

  const tokenHash = hashInviteToken(token);
  const [invite] = await db
    .select({
      id: teamMembers.id,
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      invitedEmail: teamMembers.invitedEmail,
      expiresAt: teamMembers.inviteExpiresAt,
      status: teamMembers.status,
    })
    .from(teamMembers)
    .where(eq(teamMembers.inviteTokenHash, tokenHash))
    .limit(1);

  if (!invite || invite.status !== "pending" || isInviteExpired(invite.expiresAt)) {
    return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 400 });
  }

  const invitedEmail = normalizeInviteEmail(invite.invitedEmail);
  const userEmail = normalizeInviteEmail(user.email);
  if (!invitedEmail || invitedEmail !== userEmail) {
    return NextResponse.json({ error: "This invitation was sent to a different email address." }, { status: 403 });
  }
  if (invite.userId && invite.userId !== user.id) {
    return NextResponse.json({ error: "This invitation belongs to a different account." }, { status: 403 });
  }

  // If the user already holds an accepted membership in this team, drop the
  // duplicate invite row instead of creating a second membership.
  const [existingMembership] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, invite.teamId),
      eq(teamMembers.userId, user.id),
      eq(teamMembers.status, "accepted"),
      ne(teamMembers.id, invite.id),
    ))
    .limit(1);

  if (existingMembership) {
    await db.delete(teamMembers).where(eq(teamMembers.id, invite.id));
  } else {
    await db
      .update(teamMembers)
      .set({
        userId: user.id,
        status: "accepted",
        acceptedAt: new Date(),
        inviteTokenHash: null,
        inviteExpiresAt: null,
      })
      .where(eq(teamMembers.id, invite.id));
  }

  const [team] = await db
    .select({ id: teamWorkspaces.id, name: teamWorkspaces.name })
    .from(teamWorkspaces)
    .where(eq(teamWorkspaces.id, invite.teamId))
    .limit(1);

  return NextResponse.json({ ok: true, team: team ?? null });
}
