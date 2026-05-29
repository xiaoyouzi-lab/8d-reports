import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function isUserPro(userId: string): Promise<boolean> {
  const rows = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  return rows.some((subscription) =>
    subscription.status === "active" || subscription.status === "trialing"
  );
}
