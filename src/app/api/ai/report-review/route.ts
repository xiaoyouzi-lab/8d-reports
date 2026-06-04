import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { callDeepSeekJson, isAiBetaUser } from "@/lib/ai/deepseek";
import { summarizeReportForAi } from "@/lib/ai/report-payload";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";
import { getAccessibleReport } from "@/lib/report-access";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  if (!isAiBetaUser(user.email)) {
    return NextResponse.json({ error: "AI report review is currently available to beta test accounts only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  if (!reportId) return NextResponse.json({ error: "reportId is required" }, { status: 400 });

  const report = await getAccessibleReport(reportId, user.id);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

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
