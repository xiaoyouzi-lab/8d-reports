import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer, type IncomingHttpHeaders, type Server } from "node:http";

/**
 * Offline end-to-end contract test for the paid loop.
 *
 * A real node:http server bound to 127.0.0.1 on an ephemeral port impersonates
 * the Creem API. process.env.CREEM_API_URL is pointed at it and a fake API key
 * is set BEFORE the real src/lib/creem module is imported (the base URL is read
 * at module load). Every assertion is made against the requests the fake server
 * actually received. No real Creem host is ever contacted: global fetch is
 * wrapped to reject any URL outside the fake origin.
 */

const FAKE_API_KEY = "creem_test_key_not_real";
const FAKE_WEBHOOK_SECRET = "creem_test_webhook_secret_not_real";
const FAKE_EMAIL = "buyer@example.com";

interface CapturedRequest {
  method: string;
  url: string;
  pathname: string;
  query: URLSearchParams;
  headers: IncomingHttpHeaders;
  host: string;
  body: string;
  json: unknown;
}

interface ServerReply {
  status: number;
  body?: unknown;
}

function parseJson(value: string): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  assert.ok(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `${label} must be a JSON object`,
  );
  return value as Record<string, unknown>;
}

const requests: CapturedRequest[] = [];
let responder: (request: CapturedRequest) => ServerReply = () => ({
  status: 500,
  body: { error: "no fake response configured" },
});

const server: Server = createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    const host = req.headers.host ?? "";
    const parsed = new URL(req.url ?? "/", `http://${host || "127.0.0.1"}`);
    const captured: CapturedRequest = {
      method: req.method ?? "",
      url: req.url ?? "",
      pathname: parsed.pathname,
      query: parsed.searchParams,
      headers: req.headers,
      host,
      body,
      json: parseJson(body),
    };
    requests.push(captured);
    const reply = responder(captured);
    res.statusCode = reply.status;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(reply.body ?? {}));
  });
});

const lastRequest = (): CapturedRequest => {
  const request = requests[requests.length - 1];
  assert.ok(request, "expected the fake server to have received a request");
  return request;
};

async function main(): Promise<void> {
  const realFetch = globalThis.fetch;
  let listening = false;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
    listening = true;

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("fake Creem server must bind to a TCP port");
    }
    const origin = `http://127.0.0.1:${address.port}`;

    process.env.CREEM_API_URL = origin;
    process.env.CREEM_API_KEY = FAKE_API_KEY;
    process.env.CREEM_WEBHOOK_SECRET = FAKE_WEBHOOK_SECRET;

    // Fail loudly if any code path tries to reach a real host.
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.href
          : String(input);
      if (!url.startsWith(origin)) {
        throw new Error(`paid-loop test blocked an outbound request to ${url}`);
      }
      return realFetch(input, init);
    }) as typeof fetch;

    const {
      createCheckoutSession,
      findCreemCustomerByEmail,
      generateBillingPortalLink,
      verifyCreemWebhookSignature,
    } = await import("../src/lib/creem");

    // --- createCheckoutSession -------------------------------------------------
    responder = () => ({
      status: 200,
      body: { id: "ch_fake", checkout_url: "https://creem.test/checkout/ch_fake" },
    });
    const userId = "user-fake-123";
    const checkout = await createCheckoutSession({
      productId: "prod_pro_fake",
      userId,
      customerEmail: FAKE_EMAIL,
      successUrl: "https://example.test/billing/success",
      metadata: { checkoutType: "pro_monthly" },
    }) as { id?: string };
    assert.equal(checkout.id, "ch_fake", "checkout response must be returned");
    const checkoutRequest = lastRequest();
    assert.equal(checkoutRequest.method, "POST", "checkout must use POST");
    assert.equal(checkoutRequest.pathname, "/checkouts", "checkout must call /checkouts");
    assert.equal(checkoutRequest.headers["x-api-key"], FAKE_API_KEY, "checkout must send the API key");
    const checkoutBody = asObject(checkoutRequest.json, "checkout body");
    assert.equal(checkoutBody.product_id, "prod_pro_fake", "checkout must send product_id");
    assert.deepEqual(checkoutBody.customer, { email: FAKE_EMAIL }, "checkout must send customer.email");
    assert.equal(checkoutBody.success_url, "https://example.test/billing/success", "checkout must send success_url");
    assert.equal(asObject(checkoutBody.metadata, "checkout metadata").userId, userId, "checkout metadata.userId must be set");
    assert.ok(
      typeof checkoutBody.request_id === "string" && checkoutBody.request_id.startsWith(`${userId}-`),
      "request_id must start with the user id",
    );

    responder = () => ({ status: 500, body: { error: "checkout boom" } });
    await assert.rejects(
      () => createCheckoutSession({
        productId: "prod_pro_fake",
        userId,
        customerEmail: FAKE_EMAIL,
        successUrl: "https://example.test/billing/success",
      }),
      /Creem checkout failed/,
      "a non-2xx checkout response must throw",
    );

    // --- findCreemCustomerByEmail ---------------------------------------------
    const lookup = (body: unknown, status = 200) => {
      responder = () => ({ status, body });
    };

    lookup({ id: "cust_single", email: FAKE_EMAIL });
    assert.equal(await findCreemCustomerByEmail(FAKE_EMAIL), "cust_single", "single CustomerEntity must resolve");
    const lookupRequest = lastRequest();
    assert.equal(lookupRequest.method, "GET", "customer lookup must use GET");
    assert.equal(lookupRequest.pathname, "/customers", "customer lookup must call /customers");
    assert.equal(lookupRequest.query.get("email"), FAKE_EMAIL, "customer lookup must send email as a query param");
    assert.ok(
      lookupRequest.url.includes("email=buyer%40example.com"),
      "customer lookup must URL-encode the email",
    );
    assert.equal(lookupRequest.headers["x-api-key"], FAKE_API_KEY, "customer lookup must send the API key");

    lookup({ items: [{ id: "cust_list", email: FAKE_EMAIL }], pagination: {} });
    assert.equal(await findCreemCustomerByEmail(FAKE_EMAIL), "cust_list", "{ items } response must resolve");

    lookup([{ id: "cust_array", email: FAKE_EMAIL }]);
    assert.equal(await findCreemCustomerByEmail(FAKE_EMAIL), "cust_array", "bare array response must resolve");

    lookup({
      items: [
        { id: "cust_first", email: "first@example.com" },
        { id: "cust_match", email: FAKE_EMAIL },
      ],
    });
    assert.equal(await findCreemCustomerByEmail(FAKE_EMAIL), "cust_match", "the email match must win over the first row");

    lookup({ error: "not found" }, 404);
    assert.equal(await findCreemCustomerByEmail(FAKE_EMAIL), null, "non-2xx lookup must resolve null");

    const savedKey = process.env.CREEM_API_KEY;
    delete process.env.CREEM_API_KEY;
    const beforeMissingKey = requests.length;
    lookup({ id: "cust_should_not_be_used", email: FAKE_EMAIL });
    assert.equal(await findCreemCustomerByEmail(FAKE_EMAIL), null, "missing API key must resolve null");
    assert.equal(requests.length, beforeMissingKey, "missing API key must not call the API");
    process.env.CREEM_API_KEY = savedKey;

    lookup({ id: "cust_should_not_be_used", email: FAKE_EMAIL });
    assert.equal(await findCreemCustomerByEmail(""), null, "missing email must resolve null");

    // --- generateBillingPortalLink --------------------------------------------
    responder = () => ({ status: 200, body: { customer_portal_link: "https://creem.test/portal/cust_123" } });
    assert.equal(
      await generateBillingPortalLink("cust_123"),
      "https://creem.test/portal/cust_123",
      "portal link must be returned",
    );
    const portalRequest = lastRequest();
    assert.equal(portalRequest.method, "POST", "portal must use POST");
    assert.equal(portalRequest.pathname, "/customers/billing", "portal must call /customers/billing");
    assert.deepEqual(portalRequest.json, { customer_id: "cust_123" }, "portal must send customer_id");
    assert.equal(portalRequest.headers["x-api-key"], FAKE_API_KEY, "portal must send the API key");

    responder = () => ({ status: 200, body: {} });
    await assert.rejects(
      () => generateBillingPortalLink("cust_123"),
      /returned no link/,
      "a missing portal link must throw",
    );

    responder = () => ({ status: 500, body: { error: "portal boom" } });
    await assert.rejects(
      () => generateBillingPortalLink("cust_123"),
      /billing portal failed/,
      "a non-ok portal response must throw",
    );

    // --- verifyCreemWebhookSignature ------------------------------------------
    const payload = JSON.stringify({ id: "evt_fake", type: "checkout.completed" });
    const validSignature = createHmac("sha256", FAKE_WEBHOOK_SECRET).update(payload).digest("hex");

    assert.equal(verifyCreemWebhookSignature(payload, validSignature), true, "a valid HMAC must pass");
    assert.equal(verifyCreemWebhookSignature(`${payload} `, validSignature), false, "a tampered payload must fail");
    assert.equal(verifyCreemWebhookSignature(payload, validSignature, "wrong-secret"), false, "a wrong secret must fail");
    assert.equal(verifyCreemWebhookSignature(payload, null), false, "a missing signature must fail");
    assert.equal(verifyCreemWebhookSignature(payload, ""), false, "an empty signature must fail");
    assert.equal(verifyCreemWebhookSignature(payload, `sha256=${validSignature}`), true, "a sha256= prefixed signature must pass");
    assert.equal(
      verifyCreemWebhookSignature(payload, `SHA256=${validSignature.toUpperCase()}`),
      true,
      "the sha256= prefix must be case-insensitive",
    );
    assert.equal(
      verifyCreemWebhookSignature(payload, `deadbeef,${validSignature}`),
      true,
      "one valid candidate among several must pass",
    );
    assert.equal(verifyCreemWebhookSignature(payload, "not-a-hex-signature"), false, "a non-hex signature must fail");

    const savedSecret = process.env.CREEM_WEBHOOK_SECRET;
    delete process.env.CREEM_WEBHOOK_SECRET;
    assert.equal(verifyCreemWebhookSignature(payload, validSignature), false, "a missing secret must fail");
    process.env.CREEM_WEBHOOK_SECRET = savedSecret;

    // --- isolation ------------------------------------------------------------
    for (const request of requests) {
      assert.ok(request.host.startsWith("127.0.0.1"), `unexpected request host: ${request.host}`);
    }

    console.log(`Paid loop contract checks passed (${requests.length} requests to the fake Creem server).`);
  } finally {
    globalThis.fetch = realFetch;
    if (listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
