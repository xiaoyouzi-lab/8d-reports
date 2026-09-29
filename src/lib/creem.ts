import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const CREEM_API_URL = (process.env.CREEM_API_URL?.trim() || "https://api.creem.io/v1").replace(/\/$/, "");

/**
 * Verifies a Creem webhook signature (HMAC-SHA256 hex of the raw request body).
 *
 * The signature header may be a comma-separated candidate list, and each
 * candidate may carry a "sha256=" prefix (case-insensitive). Comparison is
 * timing-safe and the function returns false for any missing or malformed
 * input. Defaults to CREEM_WEBHOOK_SECRET when no secret is supplied.
 */
export function verifyCreemWebhookSignature(
  payload: string,
  signature: string | null | undefined,
  secret?: string,
): boolean {
  const activeSecret = secret ?? process.env.CREEM_WEBHOOK_SECRET;
  if (!activeSecret) return false;
  if (!signature) return false;

  const expected = createHmac("sha256", activeSecret).update(payload).digest("hex");
  const candidates = signature
    .split(",")
    .map((part) => part.trim().replace(/^sha256=/i, ""))
    .filter(Boolean);

  return candidates.some((candidate) => {
    try {
      const expectedBuffer = Buffer.from(expected, "hex");
      const candidateBuffer = Buffer.from(candidate, "hex");
      return expectedBuffer.length === candidateBuffer.length
        && timingSafeEqual(expectedBuffer, candidateBuffer);
    } catch {
      return false;
    }
  });
}

export async function createCheckoutSession(params: {
  productId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  metadata?: Record<string, string>;
}) {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error("CREEM_API_KEY not configured");

  const res = await fetch(`${CREEM_API_URL}/checkouts`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: params.productId,
      request_id: `${params.userId}-${randomUUID()}`,
      customer: { email: params.customerEmail },
      success_url: params.successUrl,
      metadata: { userId: params.userId, ...params.metadata },
    }),
  });
  if (!res.ok) throw new Error(`Creem checkout failed: ${await res.text()}`);
  return res.json();
}

export async function generateBillingPortalLink(customerId: string): Promise<string> {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error("CREEM_API_KEY not configured");

  const res = await fetch(`${CREEM_API_URL}/customers/billing`, {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id: customerId }),
  });
  if (!res.ok) throw new Error(`Creem billing portal failed: ${await res.text()}`);
  const data = await res.json().catch(() => null) as { customer_portal_link?: unknown } | null;
  const url = data?.customer_portal_link;
  if (typeof url !== "string" || !url) throw new Error("Creem billing portal returned no link");
  return url;
}

type CreemCustomerLike = { id?: string; email?: string };
type CreemCustomerResponse =
  | CreemCustomerLike
  | { items?: CreemCustomerLike[] }
  | CreemCustomerLike[]
  | null;

/**
 * Creem exposes two customer reads with two different shapes:
 *   GET /v1/customers?email=...  -> a SINGLE CustomerEntity (the documented
 *                                   "Retrieve a customer" response)
 *   GET /v1/customers/list       -> { items: CustomerEntity[], pagination }
 * Accept both (plus a bare array) so the email fallback cannot silently return
 * null merely because the response was not a list.
 */
function creemCustomerCandidates(data: CreemCustomerResponse): CreemCustomerLike[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const items = (data as { items?: unknown }).items;
  if (Array.isArray(items)) return items as CreemCustomerLike[];
  return [data as CreemCustomerLike];
}

export async function findCreemCustomerByEmail(email: string): Promise<string | null> {
  const key = process.env.CREEM_API_KEY;
  if (!key || !email) return null;

  const res = await fetch(`${CREEM_API_URL}/customers?email=${encodeURIComponent(email)}`, {
    headers: { "x-api-key": key },
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as CreemCustomerResponse;
  const normalized = email.toLowerCase();
  const candidates = creemCustomerCandidates(data);
  const match =
    candidates.find((item) => String(item?.email ?? "").toLowerCase() === normalized) ??
    candidates[0];
  return match?.id ? String(match.id) : null;
}
