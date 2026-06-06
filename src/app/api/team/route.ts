import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { teamMembers, teamWorkspaces, users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getUserEntitlements } from "@/lib/subscription";
import { normalizeAssignableTeamRole } from "@/lib/report-workflow";

async function getOwnedTeam(userId: string) {
  return (await db
    .select()
    .from(teamWorkspaces)
    .where(eq(teamWorkspaces.ownerId, userId))
    .limit(1))[0];
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
    return { team: owned, members, role: "owner" as const };
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

  return { team: memberRow.team, members, role: memberRow.memberRole };
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

  const [updated] = await db.update(teamMembers).set({ role })
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, team.id), ne(teamMembers.userId, user.id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });
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

  await db
    .delete(teamMembers)
    .where(and(
      eq(teamMembers.id, memberId),
      eq(teamMembers.teamId, team.id),
      ne(teamMembers.userId, user.id),
    ));

  return NextResponse.json(await getTeamWithMembers(user.id));
}
