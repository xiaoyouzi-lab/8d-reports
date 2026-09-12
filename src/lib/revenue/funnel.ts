import { db } from "@/lib/db";
import { revenueFunnelEvents } from "@/lib/db/schema";
import { hashPreviewLimiterKey } from "@/lib/p0-plus/tokens";

export const REVENUE_FUNNEL_EVENTS = [
  "landing_view",
  "intake_started",
  "intake_submitted",
  "preview_generated",
  "preview_failed",
  "checkout_started",
  "purchase_completed",
  "case_created",
  "supplier_invited",
  "supplier_submitted",
  "customer_output_exported",
] as const;

export type RevenueFunnelEventName = (typeof REVENUE_FUNNEL_EVENTS)[number];
export type RevenueActorKind = "anonymous" | "owner" | "test" | "external";

function configuredEmails(name: "REVENUE_OWNER_EMAILS" | "REVENUE_TEST_EMAILS") {
  return new Set(
    (process.env[name] || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function classifyRevenueActor(input: {
  email?: string | null;
  providerMode?: string | null;
}): Exclude<RevenueActorKind, "anonymous"> {
  const email = input.email?.trim().toLowerCase() || "";
  if (email && configuredEmails("REVENUE_OWNER_EMAILS").has(email)) return "owner";
  if (
    input.providerMode === "test"
    || (email && configuredEmails("REVENUE_TEST_EMAILS").has(email))
    || /(?:\+test|\+smoke)@/.test(email)
    || /@(example\.com|resend\.dev)$/.test(email)
  ) return "test";
  return "external";
}

export function revenueFunnelIdFromBrowserToken(browserToken: string) {
  return hashPreviewLimiterKey(`browser:${browserToken}`);
}

export async function recordRevenueFunnelEvent(input: {
  eventName: RevenueFunnelEventName;
  funnelId: string;
  userId?: string | null;
  previewId?: string | null;
  purchaseId?: string | null;
  caseId?: string | null;
  actorKind?: RevenueActorKind;
  failureCode?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, string | number | boolean | null>;
  dedupeKey?: string | null;
}) {
  try {
    await db.insert(revenueFunnelEvents).values({
      eventName: input.eventName,
      funnelId: input.funnelId,
      userId: input.userId || null,
      previewId: input.previewId || null,
      purchaseId: input.purchaseId || null,
      caseId: input.caseId || null,
      actorKind: input.actorKind || "anonymous",
      failureCode: input.failureCode || null,
      durationMs: typeof input.durationMs === "number"
        ? Math.max(0, Math.round(input.durationMs))
        : null,
      metadata: input.metadata || {},
      dedupeKey: input.dedupeKey || null,
    }).onConflictDoNothing({ target: revenueFunnelEvents.dedupeKey });
  } catch (error) {
    console.warn("Revenue funnel event unavailable", {
      eventName: input.eventName,
      errorType: error instanceof Error ? error.name : "unknown",
    });
  }
}
