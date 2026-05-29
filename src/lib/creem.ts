import { randomUUID } from "node:crypto";

const CREEM_API_URL = "https://api.creem.io/v1";

export async function createCheckoutSession(params: {
  productId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
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
      metadata: { userId: params.userId },
    }),
  });
  if (!res.ok) throw new Error(`Creem checkout failed: ${await res.text()}`);
  return res.json();
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) return false;
  return signature.length > 0;
}
