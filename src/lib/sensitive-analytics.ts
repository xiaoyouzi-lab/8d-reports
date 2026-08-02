const REJECTION_REVIEW_RESULT_PREFIX = "/8d-report-review-service/review/";

export function isSensitiveAnalyticsPath(pathname: string | null | undefined) {
  if (!pathname) return false;
  return pathname.startsWith(REJECTION_REVIEW_RESULT_PREFIX);
}

export function isSensitiveAnalyticsUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    return isSensitiveAnalyticsPath(new URL(value, "https://analytics.invalid").pathname);
  } catch {
    return false;
  }
}
