import { createHmac, timingSafeEqual } from "node:crypto";
import { getRejectionReviewProviderMode } from "@/lib/rejection-review/payment-policy";

type Environment = Record<string, string | undefined>;

export function getCreemWebhookSecrets(env: Environment = process.env) {
  const mode = getRejectionReviewProviderMode(env);
  const candidates = mode === "test"
    ? [env.CREEM_REJECTION_REVIEW_TEST_WEBHOOK_SECRET, env.CREEM_TEST_WEBHOOK_SECRET]
    : [env.CREEM_REJECTION_REVIEW_WEBHOOK_SECRET, env.CREEM_WEBHOOK_SECRET];
  return [...new Set(candidates.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export function verifyCreemWebhookSignature(
  payload: string,
  signature: string | null,
  env: Environment = process.env,
) {
  if (!signature) return false;
  const candidates = signature
    .split(",")
    .map((part) => part.trim().replace(/^sha256=/i, ""))
    .filter(Boolean);
  return getCreemWebhookSecrets(env).some((secret) => {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
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
  });
}
