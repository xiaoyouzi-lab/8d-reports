import assert from "node:assert/strict";
import {
  buildRejectionReviewRevenueReport,
  REJECTION_REVIEW_IGNORED_LEGACY_EVENTS,
  REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS,
  REJECTION_REVIEW_REVENUE_SCHEMA_GAPS,
  type RejectionReviewRevenueEvent,
  type RejectionReviewRevenueFunnelEvent,
  type RejectionReviewRevenueOrder,
  type RejectionReviewRevenueTask,
} from "./revenue-report";

const BASE_TIME = Date.UTC(2026, 7, 1, 0, 0, 0);
const at = (offsetMs: number) => new Date(BASE_TIME + offsetMs);

function event(
  eventName: string,
  anonymousSessionHash: string,
  trafficSource: string,
  overrides: Partial<RejectionReviewRevenueEvent> = {},
): RejectionReviewRevenueEvent {
  return {
    eventName,
    anonymousSessionHash,
    trafficSource,
    failureType: null,
    durationMs: null,
    ...overrides,
  };
}

function task(
  id: string,
  anonymousSessionHash: string,
  trafficSource: string,
  overrides: Partial<RejectionReviewRevenueTask> = {},
): RejectionReviewRevenueTask {
  return {
    id,
    anonymousSessionHash,
    trafficSource,
    status: "full_ready",
    analysisFailureCode: null,
    ...overrides,
  };
}

function order(
  id: string,
  taskId: string | null,
  overrides: Partial<RejectionReviewRevenueOrder> = {},
): RejectionReviewRevenueOrder {
  return {
    id,
    taskId,
    providerTransactionId: `txn-${id}`,
    providerMode: "production",
    status: "paid",
    customerKind: "external",
    paidAmountCents: 3_900,
    refundedAmountCents: 0,
    currency: "USD",
    failureType: null,
    qualificationStatus: "qualified",
    deliverableReadyAt: null,
    fullResultViewedAt: null,
    exportedAt: null,
    paidAt: at(1_000),
    createdAt: at(0),
    ...overrides,
  };
}

assert.deepEqual(REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS, [
  "qualified_landing_view",
  "review_upload_started",
  "review_upload_completed",
  "review_free_result_viewed",
  "review_checkout_started",
  "review_purchase_completed",
  "review_full_result_viewed",
  "review_delivered",
  "review_refund_requested",
  "review_repeat_purchase",
]);
assert.deepEqual(REJECTION_REVIEW_IGNORED_LEGACY_EVENTS, [
  "review_landing_view",
  "review_analysis_started",
  "review_export_downloaded",
]);
assert.equal(REJECTION_REVIEW_REVENUE_SCHEMA_GAPS.includes("delivery_satisfaction_not_recorded"), true);

const tasks: RejectionReviewRevenueTask[] = [
  task("t1", "s1", "linkedin"),
  task("t2", "s2", "direct", {
    status: "analysis_failed",
    analysisFailureCode: "provider_timeout",
  }),
  task("t3", "s3", "newsletter"),
  {
    ...task("t4", "s4", "Confidential campaign name", {
      status: "analysis_failed",
      analysisFailureCode: "Customer report body must never leak",
    }),
    inputText: "customer report body secret",
    fullResultJson: { private: "AI private output" },
  } as RejectionReviewRevenueTask,
];

const events: RejectionReviewRevenueEvent[] = [
  event("qualified_landing_view", "s1", "linkedin"),
  event("review_upload_started", "s1", "linkedin"),
  event("review_upload_completed", "s1", "linkedin", { durationMs: 100 }),
  event("review_free_result_viewed", "s1", "linkedin", { durationMs: 500 }),
  event("review_checkout_started", "s1", "linkedin"),
  event("review_purchase_completed", "s1", "linkedin"),
  event("review_full_result_viewed", "s1", "linkedin"),
  event("review_delivered", "s1", "linkedin", { durationMs: 900 }),
  event("review_refund_requested", "s1", "linkedin", { failureType: "customer_request" }),
  event("review_repeat_purchase", "s1", "linkedin"),

  event("qualified_landing_view", "s2", "direct"),
  event("review_upload_started", "s2", "direct"),
  event("review_upload_started", "s2", "direct"),
  event("review_upload_completed", "s2", "direct", { durationMs: 300 }),
  event("review_free_result_viewed", "s2", "direct", {
    durationMs: 700,
    failureType: "provider_timeout",
  }),
  event("review_checkout_started", "s2", "direct"),

  event("qualified_landing_view", "s3", "linkedin"),
  event("review_upload_started", "s3", "linkedin"),
  event("review_upload_completed", "s3", "linkedin"),
  event("qualified_landing_view", "s4", "newsletter"),
  event("review_upload_completed", "s5", "partner"),

  event("review_landing_view", "legacy-1", "direct", { failureType: "must_be_ignored" }),
  event("review_analysis_started", "legacy-2", "direct"),
  event("review_export_downloaded", "legacy-3", "direct"),
  {
    ...event("not_a_real_event", "private-session", "secret source"),
    metadata: { reportText: "customer report body secret", aiOutput: "AI private output" },
  } as RejectionReviewRevenueEvent,
];

const orders: RejectionReviewRevenueOrder[] = [
  order("o1", "t1", {
    deliverableReadyAt: at(3_000),
    fullResultViewedAt: at(8_000),
  }),
  order("o2", "t2", {
    status: "refunded",
    paidAt: at(3_000),
    refundedAmountCents: 3_900,
    failureType: "customer_refund",
    deliverableReadyAt: at(7_000),
    exportedAt: at(13_000),
  }),
  order("o3", "t3", {
    providerMode: "test",
    fullResultViewedAt: at(8_000),
  }),
  order("o4", "t3", {
    customerKind: "unknown",
    paidAmountCents: 4_900,
    fullResultViewedAt: at(8_000),
  }),
  order("o5", "missing-task", {
    paidAmountCents: 5_900,
  }),
  order("o6", "t1", {
    providerTransactionId: null,
    status: "failed",
    paidAmountCents: 0,
    paidAt: null,
    failureType: "provider_declined",
  }),
  order("o7", "t1", {
    providerTransactionId: null,
    paidAmountCents: 9_900,
    fullResultViewedAt: at(8_000),
  }),
  order("o8", "t1", {
    customerKind: "owner",
    paidAmountCents: 1_000,
    fullResultViewedAt: at(8_000),
  }),
  order("o9", "t2", {
    customerKind: "test",
    paidAmountCents: 2_000,
    fullResultViewedAt: at(8_000),
  }),
  order("o10", "t3", {
    qualificationStatus: "unverified",
    paidAmountCents: 3_000,
    fullResultViewedAt: at(8_000),
    qualificationReason: "private reviewer notes",
  } as Partial<RejectionReviewRevenueOrder>),
];

const report = buildRejectionReviewRevenueReport({ events, orders, tasks });

assert.deepEqual(report.schemaGaps, REJECTION_REVIEW_REVENUE_SCHEMA_GAPS);
assert.equal(report.coverage.inputEventRows, 25);
assert.equal(report.coverage.ignoredLegacyEventRows, 3);
assert.equal(report.coverage.ignoredUnknownEventRows, 1);
assert.equal(report.eventCounts.qualified_landing_view, 4);
assert.equal(report.eventCounts.review_upload_started, 4);
assert.equal(report.uniqueSessionCounts.review_upload_started, 3);
assert.equal(report.eventCounts.review_upload_completed, 4);
assert.equal(report.eventCounts.review_delivered, 1);
assert.equal(report.eventCounts.review_repeat_purchase, 1);
assert.equal("review_landing_view" in report.eventCounts, false);

const conversion = (eventName: RejectionReviewRevenueFunnelEvent) =>
  report.conversions.find((step) => step.eventName === eventName)!;
assert.equal(conversion("qualified_landing_view").conversionRate, null);
assert.equal(conversion("review_upload_started").convertedSessionCount, 3);
assert.equal(conversion("review_upload_started").conversionRate, 3 / 4);
assert.equal(conversion("review_upload_completed").uniqueSessionCount, 4);
assert.equal(conversion("review_upload_completed").convertedSessionCount, 3);
assert.equal(conversion("review_upload_completed").conversionRate, 1);
assert.equal(conversion("review_free_result_viewed").conversionRate, 1 / 2);
assert.equal(conversion("review_purchase_completed").conversionRate, 1 / 2);
assert.equal(conversion("review_repeat_purchase").conversionRate, 1);

assert.deepEqual(report.actualPayments, {
  paidOrderCount: 7,
  grossRevenueCents: 24_600,
  refundedAmountCents: 3_900,
  netRevenueCents: 20_700,
});
assert.deepEqual(report.qualifiedRealRevenue, {
  paidOrderCount: 2,
  grossRevenueCents: 7_800,
  refundedAmountCents: 3_900,
  netRevenueCents: 3_900,
});
assert.deepEqual(report.qualifiedRevenueExclusions, {
  customer_unknown: 1,
  customer_owner: 1,
  customer_test: 1,
  not_qualified: 1,
  deliverable_not_viewed_or_exported: 1,
});

assert.deepEqual(report.failureTypes.events, {
  customer_request: 1,
  provider_timeout: 1,
});
assert.deepEqual(report.failureTypes.tasks, {
  other: 1,
  provider_timeout: 1,
});
assert.deepEqual(report.failureTypes.orders, {
  customer_refund: 1,
  provider_declined: 1,
});
assert.deepEqual(report.failureTypes.combined, {
  customer_refund: 1,
  customer_request: 1,
  other: 1,
  provider_declined: 1,
  provider_timeout: 2,
});

assert.deepEqual(report.medianDurationsMs.byEvent.review_upload_completed, {
  sampleCount: 2,
  medianMs: 200,
});
assert.deepEqual(report.medianDurationsMs.byEvent.review_free_result_viewed, {
  sampleCount: 2,
  medianMs: 600,
});
assert.deepEqual(report.medianDurationsMs.byEvent.review_checkout_started, {
  sampleCount: 0,
  medianMs: null,
});
assert.deepEqual(report.medianDurationsMs.orderLifecycle, {
  order_created_to_paid: { sampleCount: 7, medianMs: 1_000 },
  paid_to_deliverable_ready: { sampleCount: 2, medianMs: 3_000 },
  deliverable_ready_to_full_result_viewed: { sampleCount: 1, medianMs: 5_000 },
  deliverable_ready_to_exported: { sampleCount: 1, medianMs: 6_000 },
});

assert.equal(report.sourceBreakdown.linkedin.taskCount, 1);
assert.equal(report.sourceBreakdown.linkedin.eventCounts.qualified_landing_view, 2);
assert.equal(
  report.sourceBreakdown.linkedin.conversions.find(
    (step) => step.eventName === "review_upload_started",
  )?.conversionRate,
  1,
);
assert.deepEqual(report.sourceBreakdown.linkedin.actualPayments, {
  paidOrderCount: 2,
  grossRevenueCents: 4_900,
  refundedAmountCents: 0,
  netRevenueCents: 4_900,
});
assert.equal(report.sourceBreakdown.linkedin.qualifiedRealRevenue.paidOrderCount, 1);
assert.equal(report.sourceBreakdown.direct.taskCount, 1);
assert.equal(report.sourceBreakdown.direct.qualifiedRealRevenue.netRevenueCents, 0);
assert.equal(report.sourceBreakdown.newsletter.actualPayments.paidOrderCount, 2);
assert.equal(report.sourceBreakdown.unattributed.actualPayments.grossRevenueCents, 5_900);
assert.equal(report.sourceBreakdown.other.taskCount, 1);

assert.equal(report.conciergeThresholds.qualifiedUploadsWithoutCheckout.availability, "unavailable");
assert.equal(
  report.conciergeThresholds.paidOrdersWithPoorDeliverySatisfaction.unavailableReason,
  "delivery_satisfaction_not_recorded",
);
assert.equal(report.conciergeThresholds.checkoutStartsWithoutPayment.availability, "unavailable");

const serialized = JSON.stringify(report);
assert.doesNotMatch(serialized, /s1|s2|s3|private-session|o1|t1/);
assert.doesNotMatch(serialized, /customer report body|AI private output|private reviewer notes/i);
assert.doesNotMatch(serialized, /confidential campaign name/i);

const thresholdEvents: RejectionReviewRevenueEvent[] = [];
for (let index = 0; index < 108; index += 1) {
  const session = `threshold-${index}`;
  thresholdEvents.push(event("qualified_landing_view", session, "direct"));
  if (index < 20) thresholdEvents.push(event("review_upload_completed", session, "direct"));
  if (index >= 100) thresholdEvents.push(event("review_checkout_started", session, "direct"));
}
const thresholdReport = buildRejectionReviewRevenueReport({
  events: thresholdEvents,
  orders: [],
  tasks: [],
  trackingAvailability: { qualifiedLandingView: true },
});
assert.deepEqual(thresholdReport.conciergeThresholds.qualifiedUploadsWithoutCheckout, {
  threshold: 20,
  availability: "available",
  observedCount: 20,
  reached: true,
  unavailableReason: null,
});
assert.deepEqual(thresholdReport.conciergeThresholds.checkoutStartsWithoutPayment, {
  threshold: 8,
  availability: "available",
  observedCount: 8,
  reached: true,
  unavailableReason: null,
});
assert.deepEqual(thresholdReport.conciergeThresholds.qualifiedVisitsWithoutValidPurchaseSignal, {
  threshold: 100,
  availability: "available",
  observedCount: 100,
  reached: true,
  unavailableReason: null,
});
assert.deepEqual(thresholdReport.conciergeThresholds.paidOrdersWithPoorDeliverySatisfaction, {
  threshold: 3,
  availability: "unavailable",
  observedCount: null,
  reached: null,
  unavailableReason: "delivery_satisfaction_not_recorded",
});

const emptyReport = buildRejectionReviewRevenueReport({ events: [], orders: [], tasks: [] });
assert.deepEqual(Object.values(emptyReport.eventCounts), Array(10).fill(0));
assert.deepEqual(emptyReport.actualPayments, {
  paidOrderCount: 0,
  grossRevenueCents: 0,
  refundedAmountCents: 0,
  netRevenueCents: 0,
});
assert.deepEqual(emptyReport.sourceBreakdown, {});
assert.equal(emptyReport.conversions.every((step) => step.conversionRate === null), true);

const conservativeRefundReport = buildRejectionReviewRevenueReport({
  events: [],
  tasks: [task("refund-task", "refund-session", "direct")],
  orders: [
    order("over-refund", "refund-task", {
      providerTransactionId: "txn-shared",
      status: "refunded",
      paidAmountCents: 1_000,
      refundedAmountCents: 1_500,
      exportedAt: at(5_000),
    }),
    order("duplicate-transaction", "refund-task", {
      providerTransactionId: "txn-shared",
      paidAmountCents: 9_000,
      exportedAt: at(5_000),
    }),
  ],
});
assert.deepEqual(conservativeRefundReport.actualPayments, {
  paidOrderCount: 1,
  grossRevenueCents: 1_000,
  refundedAmountCents: 1_500,
  netRevenueCents: -500,
});
assert.deepEqual(conservativeRefundReport.qualifiedRealRevenue, {
  paidOrderCount: 1,
  grossRevenueCents: 1_000,
  refundedAmountCents: 1_500,
  netRevenueCents: -500,
});
assert.equal(conservativeRefundReport.coverage.ignoredDuplicateTransactionRows, 1);

console.log("8D Reject Check Concierge-first revenue report tests passed.");
