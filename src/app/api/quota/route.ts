import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { userQuotas, reports } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  const [reportCountRow] = await db
    .select({ cnt: count() })
    .from(reports)
    .where(eq(reports.userId, user.id));

  const actualReportCount = reportCountRow?.cnt ?? 0;

  const totalQuota = quota?.totalQuota ?? 5;
  const usedQuota = Math.max(quota?.usedQuota ?? 0, actualReportCount);

  if (quota && (quota.usedQuota ?? 0) < actualReportCount) {
    await db
      .update(userQuotas)
      .set({ usedQuota: actualReportCount, updatedAt: new Date() })
      .where(eq(userQuotas.userId, user.id));
  }

  return NextResponse.json({
    totalQuota,
    usedQuota,
    actualReportCount,
  });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  const [reportCountRow] = await db
    .select({ cnt: count() })
    .from(reports)
    .where(eq(reports.userId, user.id));

  const actualCount = reportCountRow?.cnt ?? 0;
  const totalQuota = quota?.totalQuota ?? 5;

  if (!quota) {
    const [newQuota] = await db
      .insert(userQuotas)
      .values({ userId: user.id, totalQuota: 5, usedQuota: actualCount })
      .returning();
    return NextResponse.json(newQuota, { status: 201 });
  }

  if (actualCount > totalQuota) {
    return NextResponse.json({ error: "Quota exhausted" }, { status: 403 });
  }

  const [updated] = await db
    .update(userQuotas)
    .set({ usedQuota: actualCount, updatedAt: new Date() })
    .where(eq(userQuotas.userId, user.id))
    .returning();

  return NextResponse.json(updated);
}
