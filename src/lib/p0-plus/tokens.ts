import { createHash, createHmac, randomBytes } from "node:crypto";

function hashSecret() {
  return process.env.P0_PLUS_PREVIEW_HASH_SECRET
    || process.env.BETTER_AUTH_SECRET
    || process.env.AUTH_SECRET
    || "p0-plus-preview-local-secret";
}

export function createPreviewToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPreviewToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPreviewLimiterKey(value: string) {
  return createHmac("sha256", hashSecret()).update(value).digest("hex");
}

export function getForwardedIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for") || "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  return firstForwarded || headers.get("x-real-ip") || "unknown";
}
