import assert from "node:assert/strict";
import { authPathWithCallback, safeCallbackUrl } from "@/lib/safe-callback-url";

assert.equal(safeCallbackUrl("/8d-report-review-service/review/token?checkout=1", "/dashboard"), "/8d-report-review-service/review/token?checkout=1");
assert.equal(safeCallbackUrl("//example.com", "/dashboard"), "/dashboard");
assert.equal(safeCallbackUrl("/\\example.com", "/dashboard"), "/dashboard");
assert.equal(safeCallbackUrl("https://example.com", "/dashboard"), "/dashboard");
assert.equal(authPathWithCallback("/signup", "/review/abc"), "/signup?callbackUrl=%2Freview%2Fabc");

console.log("Safe auth callback tests passed.");
