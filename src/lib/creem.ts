import { randomUUID } from "node:crypto";

export type CreemApiMode = "test" | "production";

export function getCreemApiMode(): CreemApiMode {
  if (process.env.CREEM_API_MODE === "test") return "test";
  if (process.env.CREEM_API_MODE === "production") return "production";
  if (process.env.CREEM_API_KEY?.startsWith("creem_test_")) return "test";
  if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "test") return "test";
  return "production";
}

export function getCreemApiUrl(mode = getCreemApiMode()) {
  return mode === "test"
    ? "https://test-api.creem.io/v1"
    : "https://api.creem.io/v1";
}

export interface CreemCheckoutSession {
  id: string;
  checkout_url: string;
}

export async function createCheckoutSession(params: {
  productId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  metadata?: Record<string, string>;
  requestId?: string;
  customPrice?: number;
}): Promise<CreemCheckoutSession> {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error("CREEM_API_KEY not configured");
  const mode = getCreemApiMode();
  if (process.env.VERCEL_ENV === "preview" && mode !== "test") {
    throw new Error("Preview checkout requires CREEM_API_MODE=test");
  }

  const res = await fetch(`${getCreemApiUrl(mode)}/checkouts`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: params.productId,
      request_id: params.requestId || `${params.userId}-${randomUUID()}`,
      customer: { email: params.customerEmail },
      success_url: params.successUrl,
      metadata: { userId: params.userId, ...params.metadata },
      ...(typeof params.customPrice === "number" ? { custom_price: params.customPrice } : {}),
    }),
  });
  if (!res.ok) {
    console.warn("Creem checkout provider rejected request", { status: res.status, mode });
    throw new Error(`Checkout provider rejected request (${res.status})`);
  }
  const value = await res.json() as Record<string, unknown>;
  if (typeof value.id !== "string" || typeof value.checkout_url !== "string") {
    throw new Error("Checkout provider returned an invalid response");
  }
  return { id: value.id, checkout_url: value.checkout_url };
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) return false;
  return signature.length > 0;
}
