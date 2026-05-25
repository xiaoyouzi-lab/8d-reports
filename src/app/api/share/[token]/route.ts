import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportShares, reports } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
    .set({ views: sql`COALESCE(views, 0) + 1` })
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
      report: {
        data: reports.data,
        title: reports.title,
        stepStatus: reports.stepStatus,
        reportType: reports.reportType,
        priority: reports.priority,
      },
    })
    .from(reportShares)
    .innerJoin(reports, eq(reportShares.reportId, reports.id))
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
  const incomingData = isPlainObject(body.data) ? body.data : {};
  const existingData = isPlainObject(share.report.data) ? share.report.data : {};
  const mergedData = { ...existingData, ...incomingData };
  const nextTitle = typeof body.title === "string" && body.title.trim()
    ? body.title.trim()
    : share.report.title;
  const nextStepStatus = isPlainObject(body.stepStatus)
    ? body.stepStatus
    : share.report.stepStatus;
  const nextReportType = ["customer_8d", "internal_8d"].includes(body.reportType)
    ? body.reportType
    : share.report.reportType;
  const nextPriority = ["low", "medium", "high"].includes(body.priority)
    ? body.priority
    : share.report.priority;

  const [updated] = await db
    .update(reports)
    .set({
      title: nextTitle,
      data: mergedData,
      stepStatus: nextStepStatus,
      reportType: nextReportType,
      priority: nextPriority,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, share.reportId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, report: updated });
}
