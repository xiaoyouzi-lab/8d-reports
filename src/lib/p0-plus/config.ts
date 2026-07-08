export {
  P0_PLUS_PREVIEW_TTL_MS,
  P0_PLUS_PREVIEW_MAX_BODY_BYTES,
  P0_PLUS_PREVIEW_MAX_INPUT_CHARS,
  P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS,
  P0_PLUS_PREVIEW_RAW_INPUT_STORAGE_CHARS,
} from "@/lib/p0-plus/limits";

import { P0_PLUS_PREVIEW_MAX_BODY_BYTES } from "@/lib/p0-plus/limits";

export const P0_PLUS_VALIDATION_PREVIEW_BRANCH = "validation/p0-plus-preview-smoke";

function isExplicitP0PlusPreviewFlagEnabled() {
  const value = (process.env.P0_PLUS_PREVIEW_ENABLED || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function isP0PlusPreviewValidationFallbackEnabled() {
  // VALIDATION-ONLY: this branch fallback exists only for PR #36 and must not be merged to main.
  return process.env.VERCEL_ENV === "preview"
    && process.env.VERCEL_GIT_COMMIT_REF === P0_PLUS_VALIDATION_PREVIEW_BRANCH;
}

export function isP0PlusPreviewEnabled() {
  return isExplicitP0PlusPreviewFlagEnabled() || isP0PlusPreviewValidationFallbackEnabled();
}

export function normalizeP0PlusOutputLanguage(value: unknown) {
  if (typeof value !== "string") return "en";
  const normalized = value.trim().toLowerCase();
  if (normalized === "zh" || normalized === "zh-cn" || normalized === "chinese") return "zh-CN";
  if (normalized === "bilingual" || normalized === "both" || normalized === "en-zh" || normalized === "zh-en") {
    return "bilingual";
  }
  return "en";
}

export function isP0PlusPreviewBodyTooLarge(contentLength: string | null) {
  if (!contentLength) return false;
  const bodyBytes = Number(contentLength);
  return Number.isFinite(bodyBytes) && bodyBytes > P0_PLUS_PREVIEW_MAX_BODY_BYTES;
}
