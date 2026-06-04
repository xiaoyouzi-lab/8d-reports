import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteR2Object } from "@/lib/r2";
import { getUserEntitlements } from "@/lib/subscription";
import { getReportAccess, logReportActivity } from "@/lib/report-workflow";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  const access = await getReportAccess(reportId, user.id);
  if (!access) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.reportId, reportId))
    .orderBy(attachments.sortOrder);

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  const access = await getReportAccess(reportId, user.id);
  if (!access) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canEdit) {
    return NextResponse.json(
      { error: access.locked ? "This report is locked" : "You do not have permission to upload attachments" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { storagePath, url, filename, fileType, mimeType, fileSize, stepId } = body;

  if (!storagePath || !url || !filename) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingRows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.reportId, reportId));

  const currentCount = existingRows.length;
  const entitlements = await getUserEntitlements(user.id);
  const maxAttachments = entitlements.maxAttachmentsPerReport;
  if (currentCount >= maxAttachments) {
    return NextResponse.json(
      { error: `Maximum ${maxAttachments} attachments per report` },
      { status: 400 }
    );
  }

  const [attachment] = await db
    .insert(attachments)
    .values({
      reportId,
      stepId: stepId || null,
      storagePath,
      url,
      filename,
      fileType: fileType || "photo",
      mimeType: mimeType || null,
      fileSize: fileSize || null,
      sortOrder: currentCount,
    })
    .returning();
  await logReportActivity({
    reportId,
    actorId: user.id,
    actorName: user.name,
    actionType: "attachment_uploaded",
    entityType: "attachment",
    entityId: attachment.id,
    metadata: { filename: attachment.filename, stepId: attachment.stepId, fileSize: attachment.fileSize },
  });

  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const url = req.nextUrl;
  const attachmentId = url.searchParams.get("attachmentId");

  if (!attachmentId) {
    return NextResponse.json({ error: "attachmentId required" }, { status: 400 });
  }

  const access = await getReportAccess(reportId, user.id);
  if (!access) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canEdit) return NextResponse.json({ error: access.locked ? "This report is locked" : "You do not have permission to delete attachments" }, { status: 403 });

  const [attachment] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, attachmentId), eq(attachments.reportId, reportId)))
    .limit(1);

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  await deleteR2Object(attachment.storagePath);

  await db
    .delete(attachments)
    .where(eq(attachments.id, attachmentId));
  await logReportActivity({
    reportId,
    actorId: user.id,
    actorName: user.name,
    actionType: "attachment_deleted",
    entityType: "attachment",
    entityId: attachment.id,
    metadata: { filename: attachment.filename, stepId: attachment.stepId, fileSize: attachment.fileSize },
  });

  return NextResponse.json({ success: true });
}
