import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { callDeepSeekJson, isAiBetaUser } from "@/lib/ai/deepseek";
import { summarizeReportForAi } from "@/lib/ai/report-payload";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";
import { getReportAccess } from "@/lib/report-workflow";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  if (!isAiBetaUser(user.email)) {
    return NextResponse.json({ error: "AI report review is currently available to beta test accounts only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  if (!reportId) return NextResponse.json({ error: "reportId is required" }, { status: 400 });

  const access = await getReportAccess(reportId, user.id);
  if (!access) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (access.locked) {
    return NextResponse.json({ error: "This report is locked. Unlock it for revision before running AI Quality Check." }, { status: 403 });
  }
  if (!access.canEdit) {
    return NextResponse.json({ error: "You do not have permission to run AI Quality Check for this report." }, { status: 403 });
  }
  const { report } = access;

  const reportData = {
    ...DEFAULT_REPORT_DATA,
    ...(typeof report.data === "object" && report.data ? report.data : {}),
    reportType: report.reportType,
    priority: report.priority,
  } as ReportData;

  try {
    const output = await callDeepSeekJson("report_review", summarizeReportForAi(reportData, report.title));
    await db.insert(aiTasks).values({
      userId: user.id,
      reportId,
      taskType: "report_review",
      inputSummary: report.title,
      output,
      status: "completed",
    }).catch(() => {});
    return NextResponse.json({ output });
  } catch (err) {
    console.error("AI Quality Check failed", { reportId, userId: user.id, err });
    await db.insert(aiTasks).values({
      userId: user.id,
      reportId,
      taskType: "report_review",
      inputSummary: report.title,
      status: "failed",
      error: err instanceof Error ? err.message : "AI failed",
    }).catch(() => {});
    return NextResponse.json({
      error: "AI Quality Check is temporarily unavailable. Your report is safely saved. Please try again later.",
    }, { status: 503 });
  }
}
