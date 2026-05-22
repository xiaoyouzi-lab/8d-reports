import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments, reports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteR2Object } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  const [report] = await db
    .select({ userId: reports.userId })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report || report.userId !== user.id) {
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

  const [report] = await db
    .select({ userId: reports.userId })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
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
  if (currentCount >= 10) {
    return NextResponse.json({ error: "Maximum 10 attachments per report" }, { status: 400 });
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

  const [report] = await db
    .select({ userId: reports.userId })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

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

  return NextResponse.json({ success: true });
}
