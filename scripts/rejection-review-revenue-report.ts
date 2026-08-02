import "dotenv/config";
import { db } from "@/lib/db";
import {
  rejectionReviewFunnelEvents,
  rejectionReviewOrders,
  rejectionReviewTasks,
} from "@/lib/db/schema";
import { buildRejectionReviewRevenueReport } from "@/lib/rejection-review/revenue-report";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const [events, orders, tasks] = await Promise.all([
    db.select({
      eventName: rejectionReviewFunnelEvents.eventName,
      anonymousSessionHash: rejectionReviewFunnelEvents.anonymousSessionHash,
      trafficSource: rejectionReviewFunnelEvents.trafficSource,
      failureType: rejectionReviewFunnelEvents.failureType,
      durationMs: rejectionReviewFunnelEvents.durationMs,
    }).from(rejectionReviewFunnelEvents),
    db.select({
      id: rejectionReviewOrders.id,
      taskId: rejectionReviewOrders.taskId,
      providerTransactionId: rejectionReviewOrders.providerTransactionId,
      providerMode: rejectionReviewOrders.providerMode,
      status: rejectionReviewOrders.status,
      customerKind: rejectionReviewOrders.customerKind,
      paidAmountCents: rejectionReviewOrders.paidAmountCents,
      refundedAmountCents: rejectionReviewOrders.refundedAmountCents,
      currency: rejectionReviewOrders.currency,
      failureType: rejectionReviewOrders.failureType,
      qualificationStatus: rejectionReviewOrders.qualificationStatus,
      deliverableReadyAt: rejectionReviewOrders.deliverableReadyAt,
      fullResultViewedAt: rejectionReviewOrders.fullResultViewedAt,
      exportedAt: rejectionReviewOrders.exportedAt,
      paidAt: rejectionReviewOrders.paidAt,
      createdAt: rejectionReviewOrders.createdAt,
    }).from(rejectionReviewOrders),
    db.select({
      id: rejectionReviewTasks.id,
      anonymousSessionHash: rejectionReviewTasks.anonymousSessionHash,
      trafficSource: rejectionReviewTasks.trafficSource,
      status: rejectionReviewTasks.status,
      analysisFailureCode: rejectionReviewTasks.analysisFailureCode,
    }).from(rejectionReviewTasks),
  ]);
  const report = buildRejectionReviewRevenueReport({
    events,
    orders,
    tasks,
    trackingAvailability: { qualifiedLandingView: true },
  });
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Revenue report failed");
  process.exitCode = 1;
});
