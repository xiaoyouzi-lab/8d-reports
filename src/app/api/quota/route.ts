import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { userQuotas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  if (!quota) {
    const [newQuota] = await db
      .insert(userQuotas)
      .values({ userId: user.id, totalQuota: 5, usedQuota: 0 })
      .returning();
    return NextResponse.json(newQuota);
  }

  return NextResponse.json(quota);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  if (!quota) {
    const [newQuota] = await db
      .insert(userQuotas)
      .values({ userId: user.id, totalQuota: 5, usedQuota: 1 })
      .returning();
    return NextResponse.json(newQuota, { status: 201 });
  }

  if ((quota.usedQuota ?? 0) >= (quota.totalQuota ?? 5)) {
    return NextResponse.json({ error: "Quota exhausted" }, { status: 403 });
  }

  const currentUsed = quota.usedQuota ?? 0;
  const [updated] = await db
    .update(userQuotas)
    .set({ usedQuota: currentUsed + 1, updatedAt: new Date() })
    .where(eq(userQuotas.userId, user.id))
    .returning();

  return NextResponse.json(updated);
}
