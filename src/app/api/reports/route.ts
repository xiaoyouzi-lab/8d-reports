import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports, userQuotas } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const rows = await db
    .select({
      id: reports.id,
      title: reports.title,
      status: reports.status,
      reportType: reports.reportType,
      priority: reports.priority,
      source: reports.source,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(eq(reports.userId, user.id))
    .orderBy(desc(reports.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const { reportType = "customer_8d", priority = "medium" } = body;

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  if (quota && (quota.usedQuota ?? 0) >= (quota.totalQuota ?? 5)) {
    return NextResponse.json(
      { error: "Quota exhausted. Upgrade to Pro to create more reports." },
      { status: 403 }
    );
  }

  const [report] = await db
    .insert(reports)
    .values({
      userId: user.id,
      title: "Untitled Report",
      reportType,
      priority,
      data: {},
      stepStatus: {},
    })
    .returning();

  if (!quota) {
    await db.insert(userQuotas).values({
      userId: user.id,
      totalQuota: 5,
      usedQuota: 0,
    });
  }

  return NextResponse.json(report, { status: 201 });
}
