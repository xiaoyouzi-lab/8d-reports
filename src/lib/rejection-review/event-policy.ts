export const REJECTION_REVIEW_FUNNEL_EVENTS = [
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

export type RejectionReviewFunnelEvent = (typeof REJECTION_REVIEW_FUNNEL_EVENTS)[number];
export type RejectionReviewActorKind = "anonymous" | "unknown" | "owner" | "test" | "external";

const SAFE_METADATA_KEYS = new Set(["sourceType", "resultStatus", "format", "priceVariant", "locale"]);

export function normalizeReviewTrafficSource(value: unknown) {
  if (typeof value !== "string") return "direct";
  const safe = value.trim().toLowerCase().replace(/[^a-z0-9._:-]/g, "-").replace(/-+/g, "-").slice(0, 64);
  return safe || "direct";
}

export function sanitizeReviewEventMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue;
    if (typeof item === "boolean") output[key] = item;
    else if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
    else if (typeof item === "string") output[key] = item.replace(/[\r\n\t]/g, " ").trim().slice(0, 80);
  }
  return output;
}

export function isRejectionReviewFunnelEvent(value: unknown): value is RejectionReviewFunnelEvent {
  return typeof value === "string" && (REJECTION_REVIEW_FUNNEL_EVENTS as readonly string[]).includes(value);
}

function emailSet(names: string[]) {
  return new Set(names.flatMap((name) => (process.env[name] || "").split(","))
    .map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export function classifyReviewActor(input: {
  email?: string | null;
  providerMode?: "test" | "production" | null;
}): Exclude<RejectionReviewActorKind, "anonymous"> {
  const email = input.email?.trim().toLowerCase() || "";
  const owners = emailSet(["REJECTION_REVIEW_OWNER_EMAILS", "ADMIN_EMAILS", "ADMIN_EMAIL"]);
  const tests = emailSet(["REJECTION_REVIEW_TEST_EMAILS", "AI_BETA_EMAILS"]);
  if (email && owners.has(email)) return "owner";
  if (
    input.providerMode === "test"
    || (email && tests.has(email))
    || /(?:\+test|\+smoke)@/.test(email)
    || /@(example\.com|resend\.dev)$/.test(email)
  ) return "test";
  return email ? "external" : "unknown";
}
