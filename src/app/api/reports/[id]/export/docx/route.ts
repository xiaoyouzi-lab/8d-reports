import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateWordDocument } from "@/lib/word-export";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";
import { canExportReportWithoutWatermark } from "@/lib/subscription";
import { getReportAccess, logReportActivity } from "@/lib/report-workflow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const body = await req.json().catch(() => ({}));
  const canExport = await canExportReportWithoutWatermark(user.id, reportId);

  if (!canExport) {
    return NextResponse.json(
      { error: "Word export requires Pro, Team, or a single-report export purchase" },
      { status: 403 }
    );
  }

  const access = await getReportAccess(reportId, user.id);
  const report = access?.report;

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canExportDraft) return NextResponse.json({ error: "You do not have permission to export reports" }, { status: 403 });

  const data: ReportData = {
    ...DEFAULT_REPORT_DATA,
    reportNumber: report.id,
    reportType: report.reportType,
    priority: report.priority,
    ...(typeof report.data === "object" && report.data ? (report.data as Record<string, unknown>) : {}),
  } as ReportData;

  for (const key of ["preparedSignatureUrl", "reviewedSignatureUrl", "approvedSignatureUrl"] as const) {
    if (data[key]?.startsWith("/")) {
      data[key] = `${req.nextUrl.origin}${data[key]}`;
    }
  }

  const attachmentRows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.reportId, reportId))
    .orderBy(attachments.sortOrder);

  const logoUrl = body.logoUrl || null;
  const locale = body.locale || "en";

  const buffer = await generateWordDocument({
    reportData: data,
    reportTitle: report.title,
    reportId,
    withWatermark: false,
    logoUrl,
    locale,
    attachmentImages: attachmentRows
      .filter((a) => a.fileType !== "signature")
      .map((a) => ({
        url: `${req.nextUrl.origin}/api/attachments/${a.id}/file`,
        filename: a.filename!,
        stepId: a.stepId || undefined,
        storagePath: a.storagePath,
        mimeType: a.mimeType,
      })),
  });
  await logReportActivity({ reportId, actorId: user.id, actorName: user.name, actionType: "report_exported", metadata: { format: "word" } });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${reportId.slice(0, 8)}_8D_Report.docx"`,
    },
  });
}
