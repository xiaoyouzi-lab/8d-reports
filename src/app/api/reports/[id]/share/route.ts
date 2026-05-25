import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reportShares, reports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isUserPro } from "@/lib/subscription";

type ReportShareUpdate = Partial<typeof reportShares.$inferInsert>;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

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
  const isPro = await isUserPro(user.id);

  if (permissionLevel === "edit" && !isPro) {
    return NextResponse.json(
      { error: "Editable share links are a Pro feature" },
      { status: 403 }
    );
  }

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
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

  return NextResponse.json(share, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const body = await req.json().catch(() => ({}));
  const permissionLevel = body.permissionLevel === "edit" ? "edit" : "view";
  const isPro = await isUserPro(user.id);

  if (permissionLevel === "edit" && !isPro) {
    return NextResponse.json(
      { error: "Editable share links are a Pro feature" },
      { status: 403 }
    );
  }

  const [updated] = await db
    .update(reportShares)
    .set({ permissionLevel } satisfies ReportShareUpdate)
    .where(and(eq(reportShares.reportId, reportId), eq(reportShares.sharedBy, user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  await db
    .delete(reportShares)
    .where(and(eq(reportShares.reportId, reportId), eq(reportShares.sharedBy, user.id)));

  return NextResponse.json({ success: true });
}
