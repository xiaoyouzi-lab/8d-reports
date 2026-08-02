import "dotenv/config";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rejectionReviewOrders } from "@/lib/db/schema";

const allowed = new Set([
  "qualified",
  "excluded_owner",
  "excluded_test",
  "excluded_friend",
  "excluded_incomplete_delivery",
]);

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const orderId = argument("--order");
  const status = argument("--status");
  const reason = argument("--reason")?.trim();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId) || !status || !allowed.has(status) || !reason || reason.length < 10) {
    throw new Error("Usage: npm run review:qualify-order -- --order <uuid> --status <qualified|excluded_owner|excluded_test|excluded_friend|excluded_incomplete_delivery> --reason <non-confidential reason>");
  }

  if (status === "qualified") {
    const [updated] = await db.update(rejectionReviewOrders).set({
      qualificationStatus: status,
      qualificationReason: reason.slice(0, 500),
      updatedAt: new Date(),
    }).where(and(
      eq(rejectionReviewOrders.id, orderId),
      eq(rejectionReviewOrders.providerMode, "production"),
      eq(rejectionReviewOrders.customerKind, "external"),
      eq(rejectionReviewOrders.status, "paid"),
      isNotNull(rejectionReviewOrders.providerTransactionId),
      isNotNull(rejectionReviewOrders.deliverableReadyAt),
    )).returning({ id: rejectionReviewOrders.id });
    if (!updated) throw new Error("The order is not a delivered, external, production payment and cannot count as qualified revenue");
  } else {
    const [updated] = await db.update(rejectionReviewOrders).set({
      qualificationStatus: status,
      qualificationReason: reason.slice(0, 500),
      updatedAt: new Date(),
    }).where(eq(rejectionReviewOrders.id, orderId)).returning({ id: rejectionReviewOrders.id });
    if (!updated) throw new Error("Order not found");
  }
  console.log(JSON.stringify({ orderId, qualificationStatus: status }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Qualification failed");
  process.exitCode = 1;
});
