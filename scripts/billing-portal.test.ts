import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { findCreemCustomerByEmail } from "../src/lib/creem";

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

// Behavioral coverage: the email fallback must accept Creem's documented
// single-entity "Retrieve a customer" response (GET /v1/customers?email=),
// not only a { items } list (GET /v1/customers/list). The string assertions
// above never exercised this parser, which is how the response-shape bug
// stayed invisible while breaking self-serve cancellation.
async function runBillingPortalBehaviorChecks() {
  process.env.CREEM_API_KEY ||= "test_key";
  const realFetch = globalThis.fetch;
  const stubFetch = (body: unknown, ok = true) => {
    globalThis.fetch = (async () => ({
      ok,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })) as unknown as typeof fetch;
  };

  try {
    stubFetch({ id: "cust_single", object: "customer", email: "buyer@example.com" });
    assert.equal(
      await findCreemCustomerByEmail("buyer@example.com"),
      "cust_single",
      "single-entity /customers response must resolve the Creem customer id",
    );

    stubFetch({ items: [{ id: "cust_list", email: "buyer@example.com" }], pagination: {} });
    assert.equal(
      await findCreemCustomerByEmail("buyer@example.com"),
      "cust_list",
      "list-style { items } response must still resolve",
    );

    stubFetch([{ id: "cust_array", email: "buyer@example.com" }]);
    assert.equal(
      await findCreemCustomerByEmail("buyer@example.com"),
      "cust_array",
      "bare-array response must still resolve",
    );

    stubFetch({ id: "cust_other", email: "other@example.com" });
    assert.equal(
      await findCreemCustomerByEmail("buyer@example.com"),
      "cust_other",
      "an email mismatch falls back to the returned customer",
    );

    stubFetch({ error: "not found" }, false);
    assert.equal(
      await findCreemCustomerByEmail("buyer@example.com"),
      null,
      "a non-ok response must resolve null",
    );
  } finally {
    globalThis.fetch = realFetch;
  }
}

runBillingPortalBehaviorChecks()
  .then(() => {
    console.log("Billing portal checks passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
