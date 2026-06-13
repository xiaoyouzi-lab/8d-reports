import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reportActivities } from "@/lib/db/schema";
import { getReportAccess } from "@/lib/report-workflow";
import { logReportActivity } from "@/lib/report-workflow";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const access = await getReportAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const activities = await db.select().from(reportActivities)
    .where(eq(reportActivities.reportId, id))
    .orderBy(desc(reportActivities.createdAt))
    .limit(100);
  return NextResponse.json(activities);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const access = await getReportAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (!access.canExportDraft) return NextResponse.json({ error: "You do not have permission to export reports" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const format = ["pdf", "word", "excel", "zip"].includes(body.format) ? body.format : "unknown";
  await logReportActivity({ reportId: id, actorId: user.id, actorName: user.name, actionType: "report_exported", metadata: { format } });
  return NextResponse.json({ success: true });
}
