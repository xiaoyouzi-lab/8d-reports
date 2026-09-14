import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const creem = read("src/lib/creem.ts");
assert.ok(creem.includes("generateBillingPortalLink"), "creem lib must expose generateBillingPortalLink");
assert.ok(creem.includes("/customers/billing"), "creem lib must call the /customers/billing portal endpoint");
assert.ok(creem.includes("findCreemCustomerByEmail"), "creem lib must support a customer lookup by email");

const route = "src/app/api/billing/portal/route.ts";
assert.equal(existsSync(path.join(root, route)), true, "billing portal route must exist");
const routeSource = read(route);
assert.ok(routeSource.includes("getSessionUser"), "billing portal route must require a session");
assert.ok(routeSource.includes("unauthorizedResponse"), "billing portal route must reject anonymous callers");
assert.ok(routeSource.includes("creemCustomerId"), "billing portal route must use the stored Creem customer id");

const quota = read("src/components/report/QuotaIndicator.tsx");
assert.ok(quota.includes("ManageSubscriptionButton"), "dashboard plan card must offer a manage-subscription control");

const pricing = read("src/app/(marketing)/pricing/page.tsx");
assert.equal(/Contact support for cancellation or billing changes/.test(pricing), false, "pricing FAQ must not tell users to contact support to cancel");
assert.ok(pricing.includes("Manage subscription in your dashboard"), "pricing FAQ must point to self-serve cancellation");

const events = read("src/app/api/events/route.ts");
assert.ok(events.includes('"billing_portal_clicked"'), "analytics allowlist must accept billing_portal_clicked");

console.log("Billing portal checks passed.");
