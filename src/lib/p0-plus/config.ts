export const P0_PLUS_PREVIEW_TTL_MS = 24 * 60 * 60 * 1000;
export const P0_PLUS_PREVIEW_MAX_BODY_BYTES = 24_000;
export const P0_PLUS_PREVIEW_MAX_INPUT_CHARS = 10_000;
export const P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS = 40;
export const P0_PLUS_PREVIEW_RAW_INPUT_STORAGE_CHARS = 10_000;

export function isP0PlusPreviewEnabled() {
  const value = (process.env.P0_PLUS_PREVIEW_ENABLED || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function normalizeP0PlusOutputLanguage(value: unknown) {
  if (value === "zh-CN" || value === "zh") return "zh-CN";
  return "en";
}
