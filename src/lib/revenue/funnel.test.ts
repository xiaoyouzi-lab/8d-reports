import assert from "node:assert/strict";
import { classifyRevenueActor, revenueFunnelIdFromBrowserToken } from "./funnel";

process.env.REVENUE_OWNER_EMAILS = "owner@8d-reports.com";
process.env.REVENUE_TEST_EMAILS = "qa@8d-reports.com";

assert.equal(classifyRevenueActor({ email: "OWNER@8d-reports.com", providerMode: "production" }), "owner");
assert.equal(classifyRevenueActor({ email: "buyer@example.com", providerMode: "production" }), "test");
assert.equal(classifyRevenueActor({ email: "real@customer.com", providerMode: "test" }), "test");
assert.equal(classifyRevenueActor({ email: "real@customer.com", providerMode: "production" }), "external");
assert.equal(revenueFunnelIdFromBrowserToken("browser-a"), revenueFunnelIdFromBrowserToken("browser-a"));
assert.notEqual(revenueFunnelIdFromBrowserToken("browser-a"), revenueFunnelIdFromBrowserToken("browser-b"));

console.log("Revenue funnel classification tests passed.");
