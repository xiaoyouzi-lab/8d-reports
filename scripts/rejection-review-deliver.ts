import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { deliverPaidRejectionReview } from "@/lib/rejection-review/payment";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const orderId = argument("--order");
  const filePath = argument("--file");
  const confirmed = process.argv.includes("--confirm-paid-delivery");
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId) || !filePath || !confirmed) {
    throw new Error(
      "Usage: npm run review:deliver -- --order <uuid> --file <delivery.json> --confirm-paid-delivery",
    );
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const deliverable = JSON.parse(await readFile(resolve(filePath), "utf8")) as unknown;
  const result = await deliverPaidRejectionReview({ orderId, deliverable });
  console.log(JSON.stringify({
    orderId: result.orderId,
    deliveredAt: result.deliveredAt.toISOString(),
    alreadyDelivered: result.alreadyDelivered,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Delivery failed");
  process.exitCode = 1;
});
