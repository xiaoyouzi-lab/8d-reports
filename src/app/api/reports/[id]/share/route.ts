import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reportShares } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserEntitlements } from "@/lib/subscription";
import { getReportAccess, logReportActivity } from "@/lib/report-workflow";

type ReportShareUpdate = Partial<typeof reportShares.$inferInsert>;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  const access = await getReportAccess(reportId, user.id);

  if (!access) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canShare) return NextResponse.json({ error: "You do not have permission to create share links" }, { status: 403 });

  const [existingShare] = await db
    .select()
    .from(reportShares)
    .where(eq(reportShares.reportId, reportId))
    .limit(1);

  if (!existingShare) {
    return NextResponse.json(null, { status: 200 });
  }

  return NextResponse.json(existingShare);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const body = await req.json().catch(() => ({}));
  const permissionLevel = body.permissionLevel === "edit" ? "edit" : "view";
  const entitlements = await getUserEntitlements(user.id);

  if (permissionLevel === "edit" && !entitlements.editableShare) {
    return NextResponse.json(
      { error: "Editable share links are a Pro or Team feature" },
      { status: 403 }
    );
  }

  const access = await getReportAccess(reportId, user.id);
  if (!access) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canShare) {
    return NextResponse.json({ error: "You do not have permission to create share links" }, { status: 403 });
  }

  const [existingShare] = await db
    .select()
    .from(reportShares)
    .where(eq(reportShares.reportId, reportId))
    .limit(1);

  if (existingShare) {
    if (existingShare.permissionLevel !== permissionLevel) {
      const [updated] = await db
        .update(reportShares)
        .set({ permissionLevel } satisfies ReportShareUpdate)
        .where(eq(reportShares.reportId, reportId))
        .returning();
      await logReportActivity({ reportId, actorId: user.id, actorName: user.name, actionType: "share_link_updated", entityType: "share", entityId: updated.id, metadata: { permissionLevel } });
      return NextResponse.json(updated);
    }
    return NextResponse.json(existingShare);
  }

  const token = crypto.randomUUID();
  const [share] = await db
    .insert(reportShares)
    .values({
      reportId,
      sharedBy: user.id,
      permissionLevel,
      accessToken: token,
    })
    .returning();
  await logReportActivity({ reportId, actorId: user.id, actorName: user.name, actionType: "share_link_created", entityType: "share", entityId: share.id, metadata: { permissionLevel } });

  return NextResponse.json(share, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const access = await getReportAccess(reportId, user.id);
  if (!access) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (!access.canShare) return NextResponse.json({ error: "You do not have permission to update share links" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const permissionLevel = body.permissionLevel === "edit" ? "edit" : "view";
  const entitlements = await getUserEntitlements(user.id);

  if (permissionLevel === "edit" && !entitlements.editableShare) {
    return NextResponse.json(
      { error: "Editable share links are a Pro or Team feature" },
      { status: 403 }
    );
  }

  const [updated] = await db
    .update(reportShares)
    .set({ permissionLevel } satisfies ReportShareUpdate)
    .where(eq(reportShares.reportId, reportId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
  await logReportActivity({ reportId, actorId: user.id, actorName: user.name, actionType: "share_link_updated", entityType: "share", entityId: updated.id, metadata: { permissionLevel } });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const access = await getReportAccess(reportId, user.id);
  if (!access) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (!access.canShare) return NextResponse.json({ error: "You do not have permission to revoke share links" }, { status: 403 });

  await db
    .delete(reportShares)
    .where(eq(reportShares.reportId, reportId));
  await logReportActivity({ reportId, actorId: user.id, actorName: user.name, actionType: "share_link_revoked", entityType: "share" });

  return NextResponse.json({ success: true });
}
