import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import { getAccessibleUserIds } from "@/lib/report-access";
import { createReportFromData } from "@/lib/report-creation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const accessibleUserIds = await getAccessibleUserIds(user.id);

  const rows = await db
    .select({
      id: reports.id,
      title: reports.title,
      status: reports.status,
      workflowStatus: reports.workflowStatus,
      revision: reports.revision,
      lockedAt: reports.lockedAt,
      reportType: reports.reportType,
      priority: reports.priority,
      source: reports.source,
      data: reports.data,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(inArray(reports.userId, accessibleUserIds))
    .orderBy(desc(reports.updatedAt));

  return NextResponse.json(rows.map((report) => {
    const data = typeof report.data === "object" && report.data
      ? report.data as Record<string, unknown>
      : {};
    return {
      id: report.id,
      title: report.title,
      status: report.status,
      workflowStatus: report.workflowStatus,
      revision: report.revision,
      lockedAt: report.lockedAt,
      reportType: report.reportType,
      priority: report.priority,
      source: report.source,
      reportNumber: typeof data.reportNumber === "string" ? data.reportNumber : null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const result = await createReportFromData({
    user,
    reportType: body.reportType,
    priority: body.priority,
  });

  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json(result.report, { status: 201 });
}
