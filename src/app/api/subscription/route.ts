import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { subscriptions, plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [sub] = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      creemSubscriptionId: subscriptions.creemSubscriptionId,
      creemCustomerId: subscriptions.creemCustomerId,
      status: subscriptions.status,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      reportsUsedThisPeriod: subscriptions.reportsUsedThisPeriod,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
      planName: plans.name,
      planDescription: plans.description,
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  return NextResponse.json(sub || null);
}
