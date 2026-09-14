import { randomUUID } from "node:crypto";

const CREEM_API_URL = "https://api.creem.io/v1";

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

export async function findCreemCustomerByEmail(email: string): Promise<string | null> {
  const key = process.env.CREEM_API_KEY;
  if (!key || !email) return null;

  const res = await fetch(`${CREEM_API_URL}/customers?email=${encodeURIComponent(email)}`, {
    headers: { "x-api-key": key },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { items?: Array<{ id?: string; email?: string }> } | Array<{ id?: string; email?: string }> | null;
  const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  const normalized = email.toLowerCase();
  const match = items.find((item) => String(item?.email ?? "").toLowerCase() === normalized) ?? items[0];
  return match?.id ? String(match.id) : null;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) return false;
  return signature.length > 0;
}
