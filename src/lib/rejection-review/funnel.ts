import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { rejectionReviewFunnelEvents } from "@/lib/db/schema";
import {
  normalizeReviewTrafficSource,
  sanitizeReviewEventMetadata,
  type RejectionReviewActorKind,
  type RejectionReviewFunnelEvent,
} from "@/lib/rejection-review/event-policy";

function reviewHashSecret() {
  const secret = process.env.REJECTION_REVIEW_HASH_SECRET
    || process.env.BETTER_AUTH_SECRET
    || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("Rejection Review hash secret is not configured");
  return "reject-check-local-only-secret";
}

export function hashReviewSession(value: string) {
  return createHmac("sha256", reviewHashSecret()).update(value).digest("hex");
}

export async function recordRejectionReviewEvent(input: {
  eventName: RejectionReviewFunnelEvent;
  anonymousSessionHash: string;
  actorKind?: RejectionReviewActorKind;
  trafficSource?: unknown;
  userId?: string | null;
  taskId?: string | null;
  orderId?: string | null;
  failureType?: string | null;
  durationMs?: number | null;
  metadata?: unknown;
  dedupeKey?: string | null;
  createdAt?: Date;
}) {
  try {
    await db.insert(rejectionReviewFunnelEvents).values({
      eventName: input.eventName,
      anonymousSessionHash: input.anonymousSessionHash,
      actorKind: input.actorKind || "anonymous",
      trafficSource: normalizeReviewTrafficSource(input.trafficSource),
      userId: input.userId || null,
      taskId: input.taskId || null,
      orderId: input.orderId || null,
      failureType: input.failureType?.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80) || null,
      durationMs: typeof input.durationMs === "number" ? Math.max(0, Math.round(input.durationMs)) : null,
      metadata: sanitizeReviewEventMetadata(input.metadata),
      dedupeKey: input.dedupeKey || null,
      createdAt: input.createdAt || new Date(),
    }).onConflictDoNothing({ target: rejectionReviewFunnelEvents.dedupeKey });
  } catch (error) {
    console.warn("Rejection Review funnel event unavailable", {
      eventName: input.eventName,
      errorType: error instanceof Error ? error.name : "unknown",
    });
  }
}
