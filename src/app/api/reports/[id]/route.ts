import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports, userQuotas } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
    .limit(1);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const [existing] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.data !== undefined) updates.data = body.data;
  if (body.stepStatus !== undefined) updates.stepStatus = body.stepStatus;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.reportType !== undefined) updates.reportType = body.reportType;
  if (body.source !== undefined) updates.source = body.source;
  if (body.hasConsumedQuota !== undefined) updates.hasConsumedQuota = body.hasConsumedQuota;

  const [updated] = await db
    .update(reports)
    .set({ ...updates, updatedAt: new Date() } as any)
    .where(eq(reports.id, id))
    .returning();

  return NextResponse.json(updated);
}
