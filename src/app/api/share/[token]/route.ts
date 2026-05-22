import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportShares, reports } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [share] = await db
    .select({
      accessToken: reportShares.accessToken,
      views: reportShares.views,
      permissionLevel: reportShares.permissionLevel,
      createdAt: reportShares.createdAt,
      report: {
        id: reports.id,
        title: reports.title,
        data: reports.data,
        stepStatus: reports.stepStatus,
        reportType: reports.reportType,
        priority: reports.priority,
        source: reports.source,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
      },
    })
    .from(reportShares)
    .innerJoin(reports, eq(reportShares.reportId, reports.id))
    .where(eq(reportShares.accessToken, token))
    .limit(1);

  if (!share) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  await db
    .update(reportShares)
    .set({ views: sql`COALESCE(views, 0) + 1` } as any)
    .where(eq(reportShares.accessToken, token));

  return NextResponse.json(share);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [share] = await db
    .select({
      reportId: reportShares.reportId,
      permissionLevel: reportShares.permissionLevel,
    })
    .from(reportShares)
    .where(eq(reportShares.accessToken, token))
    .limit(1);

  if (!share) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  if (share.permissionLevel !== "edit") {
    return NextResponse.json(
      { error: "This share link is view-only" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const [updated] = await db
    .update(reports)
    .set({
      title: body.title,
      data: body.data,
      stepStatus: body.stepStatus,
      reportType: body.reportType,
      priority: body.priority,
      updatedAt: new Date(),
    } as any)
    .where(eq(reports.id, share.reportId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, report: updated });
}
