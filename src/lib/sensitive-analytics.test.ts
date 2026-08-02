import assert from "node:assert/strict";
import { isSensitiveAnalyticsPath, isSensitiveAnalyticsUrl } from "@/lib/sensitive-analytics";

assert.equal(isSensitiveAnalyticsPath("/8d-report-review-service/review/secret-token"), true);
assert.equal(isSensitiveAnalyticsPath("/8d-report-review-service/review/secret-token/full"), true);
assert.equal(isSensitiveAnalyticsPath("/8d-report-review-service"), false);
assert.equal(isSensitiveAnalyticsUrl("https://preview.example/8d-report-review-service/review/secret?checkout=success"), true);
assert.equal(isSensitiveAnalyticsUrl("https://preview.example/8d-report-review-service/sample"), false);
assert.equal(isSensitiveAnalyticsUrl("not a valid absolute url"), false);

console.log("Sensitive analytics route tests passed.");
