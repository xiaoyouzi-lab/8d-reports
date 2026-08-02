export const REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS = [
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
] as const;

export type RejectionReviewRevenueFunnelEvent =
  (typeof REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS)[number];

export const REJECTION_REVIEW_IGNORED_LEGACY_EVENTS = [
  "review_landing_view",
  "review_analysis_started",
  "review_export_downloaded",
] as const;

export const REJECTION_REVIEW_REVENUE_SCHEMA_GAPS = [
  "delivery_satisfaction_not_recorded",
] as const;

export type RejectionReviewRevenueEvent = {
  eventName: string;
  anonymousSessionHash: string;
  trafficSource: string;
  failureType: string | null;
  durationMs: number | null;
};

export type RejectionReviewRevenueTask = {
  id: string;
  anonymousSessionHash: string;
  trafficSource: string;
  status: string;
  analysisFailureCode: string | null;
};

export type RejectionReviewRevenueOrder = {
  id: string;
  taskId: string | null;
  providerTransactionId: string | null;
  providerMode: string;
  status: string;
  customerKind: string;
  paidAmountCents: number;
  refundedAmountCents: number;
  currency: string;
  failureType: string | null;
  qualificationStatus: string;
  deliverableReadyAt: Date | null;
  fullResultViewedAt: Date | null;
  exportedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

type EventCounter = Record<RejectionReviewRevenueFunnelEvent, number>;
type SessionSets = Record<RejectionReviewRevenueFunnelEvent, Set<string>>;

export type RejectionReviewRevenueTotals = {
  paidOrderCount: number;
  grossRevenueCents: number;
  refundedAmountCents: number;
  netRevenueCents: number;
};

export type RejectionReviewConversionStep = {
  eventName: RejectionReviewRevenueFunnelEvent;
  previousEventName: RejectionReviewRevenueFunnelEvent | null;
  eventCount: number;
  uniqueSessionCount: number;
  previousUniqueSessionCount: number | null;
  convertedSessionCount: number | null;
  conversionRate: number | null;
};

type MedianDuration = {
  sampleCount: number;
  medianMs: number | null;
};

export type RejectionReviewThresholdMetric = {
  threshold: number;
  availability: "available" | "unavailable";
  observedCount: number | null;
  reached: boolean | null;
  unavailableReason: string | null;
};

export type RejectionReviewRevenueSourceBreakdown = {
  taskCount: number;
  eventCounts: EventCounter;
  uniqueSessionCounts: EventCounter;
  conversions: RejectionReviewConversionStep[];
  actualPayments: RejectionReviewRevenueTotals;
  qualifiedRealRevenue: RejectionReviewRevenueTotals;
};

export type RejectionReviewRevenueReport = {
  schemaGaps: Array<(typeof REJECTION_REVIEW_REVENUE_SCHEMA_GAPS)[number]>;
  coverage: {
    inputEventRows: number;
    inputOrderRows: number;
    inputTaskRows: number;
    ignoredLegacyEventRows: number;
    ignoredUnknownEventRows: number;
    ignoredDuplicateOrderRows: number;
    ignoredDuplicateTaskRows: number;
    ignoredDuplicateTransactionRows: number;
    unattributedActualPaymentRows: number;
  };
  eventCounts: EventCounter;
  uniqueSessionCounts: EventCounter;
  conversions: RejectionReviewConversionStep[];
  actualPayments: RejectionReviewRevenueTotals;
  qualifiedRealRevenue: RejectionReviewRevenueTotals;
  qualifiedRevenueExclusions: Record<string, number>;
  failureTypes: {
    events: Record<string, number>;
    tasks: Record<string, number>;
    orders: Record<string, number>;
    combined: Record<string, number>;
  };
  medianDurationsMs: {
    byEvent: Record<RejectionReviewRevenueFunnelEvent, MedianDuration>;
    orderLifecycle: {
      order_created_to_paid: MedianDuration;
      paid_to_deliverable_ready: MedianDuration;
      deliverable_ready_to_full_result_viewed: MedianDuration;
      deliverable_ready_to_exported: MedianDuration;
    };
  };
  sourceBreakdown: Record<string, RejectionReviewRevenueSourceBreakdown>;
  conciergeThresholds: {
    qualifiedUploadsWithoutCheckout: RejectionReviewThresholdMetric;
    checkoutStartsWithoutPayment: RejectionReviewThresholdMetric;
    paidOrdersWithPoorDeliverySatisfaction: RejectionReviewThresholdMetric;
    qualifiedVisitsWithoutValidPurchaseSignal: RejectionReviewThresholdMetric;
  };
};

type SourceAccumulator = Omit<RejectionReviewRevenueSourceBreakdown, "conversions"> & {
  sessionsByEvent: SessionSets;
};

const KNOWN_EVENTS = new Set<string>(REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS);
const LEGACY_EVENTS = new Set<string>(REJECTION_REVIEW_IGNORED_LEGACY_EVENTS);
const ACTUAL_PAYMENT_STATUSES = new Set(["paid", "refunded", "disputed"]);
const ORDER_FAILURE_STATUSES = new Set(["failed", "cancelled", "disputed"]);

function emptyEventCounter(): EventCounter {
  return Object.fromEntries(
    REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS.map((eventName) => [eventName, 0]),
  ) as EventCounter;
}

function emptySessionSets(): SessionSets {
  return Object.fromEntries(
    REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS.map((eventName) => [eventName, new Set<string>()]),
  ) as SessionSets;
}

function emptyRevenueTotals(): RejectionReviewRevenueTotals {
  return {
    paidOrderCount: 0,
    grossRevenueCents: 0,
    refundedAmountCents: 0,
    netRevenueCents: 0,
  };
}

function emptySourceAccumulator(): SourceAccumulator {
  return {
    taskCount: 0,
    eventCounts: emptyEventCounter(),
    uniqueSessionCounts: emptyEventCounter(),
    actualPayments: emptyRevenueTotals(),
    qualifiedRealRevenue: emptyRevenueTotals(),
    sessionsByEvent: emptySessionSets(),
  };
}

function isKnownEvent(value: unknown): value is RejectionReviewRevenueFunnelEvent {
  return typeof value === "string" && KNOWN_EVENTS.has(value);
}

function safeTrafficSource(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "direct";
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._:-]{0,63}$/.test(normalized) ? normalized : "other";
}

function safeFailureType(value: unknown, fallback = "unspecified") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : "other";
}

function increment(counter: Map<string, number>, key: string) {
  counter.set(key, (counter.get(key) || 0) + 1);
}

function sortedCounter(counter: Map<string, number>) {
  return Object.fromEntries([...counter.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function mergeCounters(...counters: Array<Map<string, number>>) {
  const merged = new Map<string, number>();
  for (const counter of counters) {
    for (const [key, value] of counter) merged.set(key, (merged.get(key) || 0) + value);
  }
  return merged;
}

function validDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function timestamp(value: Date | null) {
  if (!(value instanceof Date)) return null;
  const time = value.getTime();
  return Number.isFinite(time) ? time : null;
}

function elapsed(start: Date | null, end: Date | null) {
  const startTime = timestamp(start);
  const endTime = timestamp(end);
  if (startTime === null || endTime === null || endTime < startTime) return null;
  return endTime - startTime;
}

function median(values: number[]): MedianDuration {
  if (!values.length) return { sampleCount: 0, medianMs: null };
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
  return { sampleCount: sorted.length, medianMs };
}

function addRevenue(
  totals: RejectionReviewRevenueTotals,
  paidAmountCents: number,
  refundedAmountCents: number,
) {
  totals.paidOrderCount += 1;
  totals.grossRevenueCents += paidAmountCents;
  totals.refundedAmountCents += refundedAmountCents;
  totals.netRevenueCents += paidAmountCents - refundedAmountCents;
}

function actualPaymentAmounts(order: RejectionReviewRevenueOrder) {
  if (
    order.providerMode !== "production"
    || !ACTUAL_PAYMENT_STATUSES.has(order.status)
    || order.currency !== "USD"
    || typeof order.providerTransactionId !== "string"
    || !order.providerTransactionId.trim()
    || timestamp(order.paidAt) === null
    || !Number.isSafeInteger(order.paidAmountCents)
    || order.paidAmountCents <= 0
    || !Number.isSafeInteger(order.refundedAmountCents)
    || order.refundedAmountCents < 0
  ) return null;

  return {
    paidAmountCents: order.paidAmountCents,
    refundedAmountCents: order.refundedAmountCents,
  };
}

function qualificationExclusion(order: RejectionReviewRevenueOrder) {
  if (order.customerKind !== "external") {
    if (["unknown", "owner", "test"].includes(order.customerKind)) {
      return `customer_${order.customerKind}`;
    }
    return "customer_other";
  }
  if (order.qualificationStatus !== "qualified") return "not_qualified";
  if (timestamp(order.fullResultViewedAt) === null && timestamp(order.exportedAt) === null) {
    return "deliverable_not_viewed_or_exported";
  }
  return null;
}

function buildConversions(eventCounts: EventCounter, sessionsByEvent: SessionSets) {
  return REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS.map((eventName, index) => {
    const currentSessions = sessionsByEvent[eventName];
    const previousEventName = index === 0 ? null : REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS[index - 1];
    if (!previousEventName) {
      return {
        eventName,
        previousEventName: null,
        eventCount: eventCounts[eventName],
        uniqueSessionCount: currentSessions.size,
        previousUniqueSessionCount: null,
        convertedSessionCount: null,
        conversionRate: null,
      };
    }

    const previousSessions = sessionsByEvent[previousEventName];
    let convertedSessionCount = 0;
    for (const session of currentSessions) {
      if (previousSessions.has(session)) convertedSessionCount += 1;
    }
    return {
      eventName,
      previousEventName,
      eventCount: eventCounts[eventName],
      uniqueSessionCount: currentSessions.size,
      previousUniqueSessionCount: previousSessions.size,
      convertedSessionCount,
      conversionRate: previousSessions.size > 0 ? convertedSessionCount / previousSessions.size : null,
    };
  });
}

function thresholdMetric(threshold: number, observedCount: number): RejectionReviewThresholdMetric {
  return {
    threshold,
    availability: "available",
    observedCount,
    reached: observedCount >= threshold,
    unavailableReason: null,
  };
}

function unavailableThreshold(threshold: number, reason: string): RejectionReviewThresholdMetric {
  return {
    threshold,
    availability: "unavailable",
    observedCount: null,
    reached: null,
    unavailableReason: reason,
  };
}

function countSessions(
  source: Set<string>,
  predicate: (session: string) => boolean,
) {
  let count = 0;
  for (const session of source) {
    if (predicate(session)) count += 1;
  }
  return count;
}

/**
 * Builds a JSON-safe aggregate from explicit analytics projections only.
 * Task input, result JSON, event metadata, qualification reasons, AI output,
 * and provider payloads are deliberately absent from the input contract.
 */
export function buildRejectionReviewRevenueReport(input: {
  events: readonly RejectionReviewRevenueEvent[];
  orders: readonly RejectionReviewRevenueOrder[];
  tasks: readonly RejectionReviewRevenueTask[];
  trackingAvailability?: {
    qualifiedLandingView: boolean;
  };
}): RejectionReviewRevenueReport {
  const eventCounts = emptyEventCounter();
  const sessionsByEvent = emptySessionSets();
  const eventDurations = Object.fromEntries(
    REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS.map((eventName) => [eventName, [] as number[]]),
  ) as Record<RejectionReviewRevenueFunnelEvent, number[]>;
  const sourceAccumulators = new Map<string, SourceAccumulator>();
  const sourceFor = (source: string) => {
    let accumulator = sourceAccumulators.get(source);
    if (!accumulator) {
      accumulator = emptySourceAccumulator();
      sourceAccumulators.set(source, accumulator);
    }
    return accumulator;
  };

  const eventFailures = new Map<string, number>();
  let ignoredLegacyEventRows = 0;
  let ignoredUnknownEventRows = 0;
  for (const event of input.events) {
    if (LEGACY_EVENTS.has(event.eventName)) {
      ignoredLegacyEventRows += 1;
      continue;
    }
    if (!isKnownEvent(event.eventName)) {
      ignoredUnknownEventRows += 1;
      continue;
    }

    const sourceReport = sourceFor(safeTrafficSource(event.trafficSource));
    eventCounts[event.eventName] += 1;
    sourceReport.eventCounts[event.eventName] += 1;

    const sessionHash = typeof event.anonymousSessionHash === "string"
      ? event.anonymousSessionHash.trim()
      : "";
    if (sessionHash) {
      sessionsByEvent[event.eventName].add(sessionHash);
      sourceReport.sessionsByEvent[event.eventName].add(sessionHash);
    }
    if (validDuration(event.durationMs)) eventDurations[event.eventName].push(event.durationMs);
    if (event.failureType) increment(eventFailures, safeFailureType(event.failureType));
  }

  const taskFailures = new Map<string, number>();
  const taskAttribution = new Map<string, { source: string; sessionHash: string }>();
  let ignoredDuplicateTaskRows = 0;
  for (const task of input.tasks) {
    if (!task.id || taskAttribution.has(task.id)) {
      ignoredDuplicateTaskRows += 1;
      continue;
    }
    const source = safeTrafficSource(task.trafficSource);
    taskAttribution.set(task.id, {
      source,
      sessionHash: typeof task.anonymousSessionHash === "string"
        ? task.anonymousSessionHash.trim()
        : "",
    });
    sourceFor(source).taskCount += 1;
    if (task.status === "analysis_failed") {
      increment(taskFailures, safeFailureType(task.analysisFailureCode));
    }
  }

  const actualPayments = emptyRevenueTotals();
  const qualifiedRealRevenue = emptyRevenueTotals();
  const qualifiedRevenueExclusions = new Map<string, number>();
  const orderFailures = new Map<string, number>();
  const seenOrderIds = new Set<string>();
  const seenTransactions = new Set<string>();
  const actualPaymentSessions = new Set<string>();
  let ignoredDuplicateOrderRows = 0;
  let ignoredDuplicateTransactionRows = 0;
  let unattributedActualPaymentRows = 0;
  const lifecycleDurations = {
    order_created_to_paid: [] as number[],
    paid_to_deliverable_ready: [] as number[],
    deliverable_ready_to_full_result_viewed: [] as number[],
    deliverable_ready_to_exported: [] as number[],
  };

  for (const order of input.orders) {
    if (!order.id || seenOrderIds.has(order.id)) {
      ignoredDuplicateOrderRows += 1;
      continue;
    }
    seenOrderIds.add(order.id);

    if (order.failureType || ORDER_FAILURE_STATUSES.has(order.status)) {
      increment(orderFailures, safeFailureType(order.failureType));
    }

    const payment = actualPaymentAmounts(order);
    if (!payment) continue;
    const transactionId = order.providerTransactionId!.trim();
    if (seenTransactions.has(transactionId)) {
      ignoredDuplicateTransactionRows += 1;
      continue;
    }
    seenTransactions.add(transactionId);

    const attribution = order.taskId ? taskAttribution.get(order.taskId) : undefined;
    const sourceReport = sourceFor(attribution?.source || "unattributed");
    if (attribution?.sessionHash) actualPaymentSessions.add(attribution.sessionHash);
    else unattributedActualPaymentRows += 1;

    addRevenue(actualPayments, payment.paidAmountCents, payment.refundedAmountCents);
    addRevenue(sourceReport.actualPayments, payment.paidAmountCents, payment.refundedAmountCents);

    const createdToPaid = elapsed(order.createdAt, order.paidAt);
    const paidToReady = elapsed(order.paidAt, order.deliverableReadyAt);
    const readyToViewed = elapsed(order.deliverableReadyAt, order.fullResultViewedAt);
    const readyToExported = elapsed(order.deliverableReadyAt, order.exportedAt);
    if (createdToPaid !== null) lifecycleDurations.order_created_to_paid.push(createdToPaid);
    if (paidToReady !== null) lifecycleDurations.paid_to_deliverable_ready.push(paidToReady);
    if (readyToViewed !== null) lifecycleDurations.deliverable_ready_to_full_result_viewed.push(readyToViewed);
    if (readyToExported !== null) lifecycleDurations.deliverable_ready_to_exported.push(readyToExported);

    const exclusion = qualificationExclusion(order);
    if (exclusion) {
      increment(qualifiedRevenueExclusions, exclusion);
      continue;
    }
    addRevenue(qualifiedRealRevenue, payment.paidAmountCents, payment.refundedAmountCents);
    addRevenue(sourceReport.qualifiedRealRevenue, payment.paidAmountCents, payment.refundedAmountCents);
  }

  const uniqueSessionCounts = emptyEventCounter();
  for (const eventName of REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS) {
    uniqueSessionCounts[eventName] = sessionsByEvent[eventName].size;
  }

  const sourceBreakdown: Record<string, RejectionReviewRevenueSourceBreakdown> = {};
  for (const [source, accumulator] of [...sourceAccumulators.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    for (const eventName of REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS) {
      accumulator.uniqueSessionCounts[eventName] = accumulator.sessionsByEvent[eventName].size;
    }
    sourceBreakdown[source] = {
      taskCount: accumulator.taskCount,
      eventCounts: accumulator.eventCounts,
      uniqueSessionCounts: accumulator.uniqueSessionCounts,
      conversions: buildConversions(accumulator.eventCounts, accumulator.sessionsByEvent),
      actualPayments: accumulator.actualPayments,
      qualifiedRealRevenue: accumulator.qualifiedRealRevenue,
    };
  }

  const qualifiedLandingAvailable = input.trackingAvailability?.qualifiedLandingView === true;
  const qualifiedLandings = sessionsByEvent.qualified_landing_view;
  const completedUploads = sessionsByEvent.review_upload_completed;
  const checkoutStarts = sessionsByEvent.review_checkout_started;
  const qualifiedUploadsWithoutCheckout = countSessions(
    qualifiedLandings,
    (session) => completedUploads.has(session) && !checkoutStarts.has(session),
  );
  const checkoutStartsWithoutPayment = countSessions(
    checkoutStarts,
    (session) => !actualPaymentSessions.has(session),
  );
  const qualifiedVisitsWithoutValidPurchaseSignal = countSessions(
    qualifiedLandings,
    (session) => !checkoutStarts.has(session) && !actualPaymentSessions.has(session),
  );

  const byEvent = Object.fromEntries(
    REJECTION_REVIEW_REVENUE_FUNNEL_EVENTS.map((eventName) => [eventName, median(eventDurations[eventName])]),
  ) as Record<RejectionReviewRevenueFunnelEvent, MedianDuration>;

  return {
    schemaGaps: [...REJECTION_REVIEW_REVENUE_SCHEMA_GAPS],
    coverage: {
      inputEventRows: input.events.length,
      inputOrderRows: input.orders.length,
      inputTaskRows: input.tasks.length,
      ignoredLegacyEventRows,
      ignoredUnknownEventRows,
      ignoredDuplicateOrderRows,
      ignoredDuplicateTaskRows,
      ignoredDuplicateTransactionRows,
      unattributedActualPaymentRows,
    },
    eventCounts,
    uniqueSessionCounts,
    conversions: buildConversions(eventCounts, sessionsByEvent),
    actualPayments,
    qualifiedRealRevenue,
    qualifiedRevenueExclusions: sortedCounter(qualifiedRevenueExclusions),
    failureTypes: {
      events: sortedCounter(eventFailures),
      tasks: sortedCounter(taskFailures),
      orders: sortedCounter(orderFailures),
      combined: sortedCounter(mergeCounters(eventFailures, taskFailures, orderFailures)),
    },
    medianDurationsMs: {
      byEvent,
      orderLifecycle: {
        order_created_to_paid: median(lifecycleDurations.order_created_to_paid),
        paid_to_deliverable_ready: median(lifecycleDurations.paid_to_deliverable_ready),
        deliverable_ready_to_full_result_viewed: median(
          lifecycleDurations.deliverable_ready_to_full_result_viewed,
        ),
        deliverable_ready_to_exported: median(lifecycleDurations.deliverable_ready_to_exported),
      },
    },
    sourceBreakdown,
    conciergeThresholds: {
      qualifiedUploadsWithoutCheckout: qualifiedLandingAvailable
        ? thresholdMetric(20, qualifiedUploadsWithoutCheckout)
        : unavailableThreshold(20, "qualified_landing_view_not_tracked"),
      checkoutStartsWithoutPayment: unattributedActualPaymentRows === 0
        ? thresholdMetric(8, checkoutStartsWithoutPayment)
        : unavailableThreshold(8, "actual_payment_session_attribution_incomplete"),
      paidOrdersWithPoorDeliverySatisfaction: unavailableThreshold(
        3,
        "delivery_satisfaction_not_recorded",
      ),
      qualifiedVisitsWithoutValidPurchaseSignal: qualifiedLandingAvailable
        && unattributedActualPaymentRows === 0
        ? thresholdMetric(100, qualifiedVisitsWithoutValidPurchaseSignal)
        : unavailableThreshold(
          100,
          qualifiedLandingAvailable
            ? "actual_payment_session_attribution_incomplete"
            : "qualified_landing_view_not_tracked",
        ),
    },
  };
}
