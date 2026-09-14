import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { findCreemCustomerByEmail, generateBillingPortalLink } from "@/lib/creem";

export const runtime = "nodejs";

/**
 * Returns a Creem-hosted Customer Portal link so a paying user can manage or
 * cancel their subscription self-serve. The customer id is stored on the
 * subscription row at checkout; fall back to a Creem lookup by account email.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const rows = await db
    .select({ customerId: subscriptions.creemCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(5);

  let customerId = rows.find((row) => row.customerId)?.customerId ?? null;
  if (!customerId) {
    customerId = await findCreemCustomerByEmail(user.email);
  }

  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found for this email yet." },
      { status: 404 },
    );
  }

  try {
    const url = await generateBillingPortalLink(customerId);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json({ error: "Could not open the billing portal. Please try again." }, { status: 502 });
  }
}
