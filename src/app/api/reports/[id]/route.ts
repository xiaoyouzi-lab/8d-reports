import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type ReportUpdate = Partial<typeof reports.$inferInsert>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

  const updates: ReportUpdate = {};
  if (typeof body.title === "string") updates.title = body.title.trim() || "Untitled Report";
  if (isPlainObject(body.data)) updates.data = body.data;
  if (isPlainObject(body.stepStatus)) updates.stepStatus = body.stepStatus;
  if (["draft", "in_progress", "completed"].includes(body.status)) updates.status = body.status;
  if (["low", "medium", "high"].includes(body.priority)) updates.priority = body.priority;
  if (["customer_8d", "internal_8d"].includes(body.reportType)) updates.reportType = body.reportType;
  if (typeof body.source === "string") updates.source = body.source;
  if (typeof body.hasConsumedQuota === "boolean") updates.hasConsumedQuota = body.hasConsumedQuota;

  const [updated] = await db
    .update(reports)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(reports.id, id))
    .returning();

  return NextResponse.json(updated);
}
