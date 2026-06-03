import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_REPORT_DATA, getReportCompletionIssues, type ReportData } from "@/lib/report-steps";
import { getAccessibleReport } from "@/lib/report-access";
import { canExportReportWithoutWatermark, getUserEntitlements } from "@/lib/subscription";

type ReportUpdate = Partial<typeof reports.$inferInsert>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const report = await getAccessibleReport(id, user.id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const [entitlements, canExportWithoutWatermark] = await Promise.all([
    getUserEntitlements(user.id),
    canExportReportWithoutWatermark(user.id, id),
  ]);

  return NextResponse.json({
    ...report,
    permissions: {
      plan: entitlements.plan,
      canExportWithoutWatermark,
      canExportWord: entitlements.wordExport || canExportWithoutWatermark,
      canUseLogo: entitlements.companyLogo,
      canUseEditableShare: entitlements.editableShare,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await getAccessibleReport(id, user.id);

  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const updates: ReportUpdate = {};
  if (typeof body.title === "string") updates.title = body.title.trim() || "Untitled Report";
  if (isPlainObject(body.data)) updates.data = body.data;
  if (isPlainObject(body.stepStatus)) updates.stepStatus = body.stepStatus;
  if (["draft", "in_progress", "completed"].includes(body.status)) updates.status = body.status;
  if (["low", "medium", "high"].includes(body.priority)) updates.priority = body.priority;
  if (["customer_8d", "internal_8d"].includes(body.reportType)) updates.reportType = body.reportType;
  if (typeof body.source === "string") updates.source = body.source;
  if (typeof body.hasConsumedQuota === "boolean") updates.hasConsumedQuota = body.hasConsumedQuota;

  if (updates.status === "completed") {
    const existingData = isPlainObject(existing.data) ? existing.data : {};
    const incomingData = isPlainObject(body.data) ? body.data : {};
    const data = {
      ...DEFAULT_REPORT_DATA,
      ...existingData,
      ...incomingData,
      reportType: updates.reportType || existing.reportType,
      priority: updates.priority || existing.priority,
    } as ReportData;
    const issues = getReportCompletionIssues(data);
    if (issues.length > 0) {
      return NextResponse.json(
        { error: "Complete key report fields before closing", issues },
        { status: 400 }
      );
    }
  }

  const [updated] = await db
    .update(reports)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(reports.id, id))
    .returning();

  return NextResponse.json(updated);
}
