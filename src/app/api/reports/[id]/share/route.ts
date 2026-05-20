import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reportShares, reports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const [existingShare] = await db
    .select()
    .from(reportShares)
    .where(eq(reportShares.reportId, reportId))
    .limit(1);

  if (existingShare) {
    return NextResponse.json(existingShare);
  }

  const token = crypto.randomUUID();
  const [share] = await db
    .insert(reportShares)
    .values({
      reportId,
      sharedBy: user.id,
      permissionLevel: "view",
      accessToken: token,
    })
    .returning();

  return NextResponse.json(share, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;

  await db
    .delete(reportShares)
    .where(and(eq(reportShares.reportId, reportId), eq(reportShares.sharedBy, user.id)));

  return NextResponse.json({ success: true });
}
