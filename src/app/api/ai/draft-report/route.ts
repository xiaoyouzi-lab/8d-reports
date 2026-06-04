import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { callDeepSeekJson, isAiBetaUser } from "@/lib/ai/deepseek";
import { summarizeMaterialsForAi } from "@/lib/ai/report-payload";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";
import { getAccessibleReport } from "@/lib/report-access";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  if (!isAiBetaUser(user.email)) {
    return NextResponse.json({ error: "AI draft generation is currently available to beta test accounts only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const materials = typeof body.materials === "string" ? body.materials.trim() : "";
  if (!reportId || !materials) {
    return NextResponse.json({ error: "reportId and materials are required" }, { status: 400 });
  }
  if (materials.length > 10000) {
    return NextResponse.json({ error: "Materials are too long" }, { status: 400 });
  }

  const report = await getAccessibleReport(reportId, user.id);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const reportData = {
    ...DEFAULT_REPORT_DATA,
    ...(typeof report.data === "object" && report.data ? report.data : {}),
  } as ReportData;

  try {
    const output = await callDeepSeekJson("draft_generation", summarizeMaterialsForAi(materials, reportData));
    await db.insert(aiTasks).values({
      userId: user.id,
      reportId,
      taskType: "draft_generation",
      inputSummary: materials.slice(0, 500),
      output,
      status: "completed",
    }).catch(() => {});
    return NextResponse.json({ output });
  } catch (err) {
    console.error("AI Draft failed", { reportId, userId: user.id, err });
    await db.insert(aiTasks).values({
      userId: user.id,
      reportId,
      taskType: "draft_generation",
      inputSummary: materials.slice(0, 500),
      status: "failed",
      error: err instanceof Error ? err.message : "AI failed",
    }).catch(() => {});
    return NextResponse.json({
      error: "AI Draft is temporarily unavailable. Your report is safely saved. Please try again later.",
    }, { status: 503 });
  }
}
