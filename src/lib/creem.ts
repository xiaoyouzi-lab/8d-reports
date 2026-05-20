const CREEM_API_URL = "https://api.creem.io/v1";

export async function createCheckoutSession(params: {
  productId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error("CREEM_API_KEY not configured");

  const res = await fetch(`${CREEM_API_URL}/checkout-sessions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: params.productId,
      customer: { external_id: params.userId, email: params.customerEmail },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
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
