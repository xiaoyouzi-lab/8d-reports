import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports, attachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateWordDocument } from "@/lib/word-export";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const body = await req.json().catch(() => ({}));

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
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

  const isPro = body.plan !== "free";
  const logoUrl = body.logoUrl || null;
  const locale = body.locale || "en";

  const buffer = await generateWordDocument({
    reportData: data,
    reportTitle: report.title,
    reportId,
    withWatermark: !isPro,
    logoUrl,
    locale,
    attachmentImages: attachmentRows
      .filter((a) => a.fileType === "photo" || a.mimeType?.startsWith("image/"))
      .map((a) => ({ url: a.url!, filename: a.filename!, stepId: a.stepId || undefined })),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${reportId.slice(0, 8)}_8D_Report.docx"`,
    },
  });
}
