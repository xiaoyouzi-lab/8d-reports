import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import {
  getReportAccess,
  isWorkflowStatus,
  LOCKED_WORKFLOW_STATUSES,
  logReportActivity,
  type WorkflowStatus,
} from "@/lib/report-workflow";
import { DEFAULT_REPORT_DATA, getReportCompletionIssues, type ReportData } from "@/lib/report-steps";
import { getUserEntitlements } from "@/lib/subscription";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const access = await getReportAccess(id, user.id);
  if (!access) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  const entitlements = await getUserEntitlements(user.id);
  if (entitlements.plan !== "team") {
    return NextResponse.json({ error: "Approval, locking, and revisions require the Team plan." }, { status: 403 });
  }
  if (!access.canManageWorkflow) {
    return NextResponse.json({ error: "Only the report owner can change approval status or unlock revisions." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action === "unlock" ? "unlock" : "transition";

  if (action === "unlock") {
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) return NextResponse.json({ error: "A revision reason is required" }, { status: 400 });

    const [updated] = await db.update(reports).set({
      workflowStatus: "draft",
      lockedAt: null,
      lockedBy: null,
      revision: (access.report.revision || 0) + 1,
      updatedAt: new Date(),
    }).where(eq(reports.id, id)).returning();

    await logReportActivity({
      reportId: id,
      actorId: user.id,
      actorName: user.name,
      actionType: "report_unlocked",
      oldValue: access.report.workflowStatus,
      newValue: "draft",
      reason,
      metadata: { revision: updated.revision },
    });
    return NextResponse.json(updated);
  }

  if (!isWorkflowStatus(body.workflowStatus)) {
    return NextResponse.json({ error: "Invalid workflow status" }, { status: 400 });
  }
  if (
    LOCKED_WORKFLOW_STATUSES.has(access.report.workflowStatus as WorkflowStatus)
    && !LOCKED_WORKFLOW_STATUSES.has(body.workflowStatus)
  ) {
    return NextResponse.json(
      { error: "Locked reports must use Unlock for revision and include a reason." },
      { status: 400 },
    );
  }

  if (LOCKED_WORKFLOW_STATUSES.has(body.workflowStatus)) {
    const reportData = {
      ...DEFAULT_REPORT_DATA,
      ...(typeof access.report.data === "object" && access.report.data ? access.report.data : {}),
      reportType: access.report.reportType,
      priority: access.report.priority,
    } as ReportData;
    const issues = getReportCompletionIssues(reportData);
    if (issues.length > 0) {
      return NextResponse.json({ error: "Complete key report fields before approval or submission", issues }, { status: 400 });
    }
  }

  const locked = LOCKED_WORKFLOW_STATUSES.has(body.workflowStatus);
  const [updated] = await db.update(reports).set({
    workflowStatus: body.workflowStatus,
    lockedAt: locked ? new Date() : null,
    lockedBy: locked ? user.id : null,
    updatedAt: new Date(),
  }).where(eq(reports.id, id)).returning();

  await logReportActivity({
    reportId: id,
    actorId: user.id,
    actorName: user.name,
    actionType: locked ? "report_approved_or_locked" : "workflow_status_changed",
    fieldName: "workflowStatus",
    oldValue: access.report.workflowStatus,
    newValue: body.workflowStatus,
  });
  return NextResponse.json(updated);
}
