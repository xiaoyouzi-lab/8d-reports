import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";
import { canExportReportWithoutWatermark } from "@/lib/subscription";
import { getReportAccess, logReportActivity } from "@/lib/report-workflow";
import { generateExcelWorkbook } from "@/lib/xlsx-export";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const canExport = await canExportReportWithoutWatermark(user.id, reportId);

  if (!canExport) {
    return NextResponse.json(
      { error: "Excel export requires Pro, Team, or a single-report export purchase" },
      { status: 403 }
    );
  }

  const access = await getReportAccess(reportId, user.id);
  const report = access?.report;

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canExportDraft) {
    return NextResponse.json({ error: "You do not have permission to export reports" }, { status: 403 });
  }

  const data: ReportData = {
    ...DEFAULT_REPORT_DATA,
    reportNumber: report.id,
    reportType: report.reportType,
    priority: report.priority,
    ...(typeof report.data === "object" && report.data ? (report.data as Record<string, unknown>) : {}),
  } as ReportData;

  const attachmentRows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.reportId, reportId))
    .orderBy(attachments.sortOrder);

  const buffer = await generateExcelWorkbook({
    reportData: data,
    reportTitle: report.title,
    reportId,
    status: report.status,
    workflowStatus: report.workflowStatus,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    attachments: attachmentRows
      .filter((attachment) => attachment.fileType !== "signature")
      .map((attachment) => ({
        filename: attachment.filename,
        fileType: attachment.fileType,
        mimeType: attachment.mimeType,
        stepId: attachment.stepId,
        fileSize: attachment.fileSize,
        createdAt: attachment.createdAt,
      })),
  });

  await logReportActivity({
    reportId,
    actorId: user.id,
    actorName: user.name,
    actionType: "report_exported",
    metadata: { format: "excel" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${reportId.slice(0, 8)}_8D_Report.xlsx"`,
    },
  });
}
