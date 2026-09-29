# Paid Loop Acceptance Runbook (Creem sandbox)

Status: **open acceptance gate.** The paid loop is verified offline by
`npm run test:paid-loop` against a local fake Creem server, but it has **not**
been exercised against Creem's real sandbox with test credentials. This document
is the remaining gate: whoever has a Creem **test-mode** API key must walk the
sequence below once and record the observations.

> **Never use the production Creem key for this runbook.** Use a Creem *test
> mode* key, test-mode product ids, and a test-mode webhook secret only. The
> repository `.env` currently holds production Creem credentials; do not point
> the app at them for acceptance. Real charges must never be created.
>
> Never call the real Creem API from an automated test. `npm run test:paid-loop`
> is fully offline and must stay that way (it points `CREEM_API_URL` at a local
> 127.0.0.1 server and blocks any other outbound request).

## 1. Prerequisites (in the Creem dashboard, Test Mode ON)

1. Toggle **Test Mode** in the Creem dashboard.
2. **Developers → API keys → Create test key.** Copy it (it is the
   `CREEM_API_KEY` test key).
3. **Products → create two test-mode recurring products** (Pro monthly and Team
   monthly) and copy their product ids.
4. **Developers → Webhooks → Add endpoint** (see step 3 below) and copy the
   generated signing secret.

## 2. Environment variables

Set these in the deployment/preview environment that will host the sandbox
acceptance run (Vercel Preview or a local production-mode server). Do **not**
edit the committed `.env`.

| Variable | Sandbox value | Notes |
| --- | --- | --- |
| `CREEM_API_URL` | `https://test-api.creem.io/v1` | Sandbox host. Unset means production `https://api.creem.io/v1`. Optional. |
| `CREEM_API_KEY` | Creem **test-mode** key | Required by checkout, portal, and customer lookup. |
| `CREEM_PRODUCT_PRO_MONTHLY` | test-mode Pro monthly product id | `CREEM_PRODUCT_MONTHLY` is the legacy fallback and also works. |
| `CREEM_PRODUCT_TEAM_MONTHLY` | test-mode Team monthly product id | Required for the Team leg. |
| `CREEM_PRODUCT_SINGLE_REPORT_EXPORT` | test-mode single-export product id | Optional; only for the single-report purchase leg. |
| `CREEM_WEBHOOK_SECRET` | test-mode webhook signing secret | Must match the endpoint registered in step 3. |
| `BETTER_AUTH_URL` | public URL of this sandbox deployment | Used to build the checkout `success_url`; set it so the redirect returns to the sandbox. |

After changing env vars, redeploy/restart so
`src/lib/creem.ts` re-reads `CREEM_API_URL` (it is read at module load).

## 3. Register the webhook endpoint

In **Creem dashboard → Test Mode → Developers → Webhooks → Add endpoint**:

- URL: `https://<sandbox-host>/api/webhooks/creem`
- Subscribe to the events the route understands:
  - activation: `checkout.completed`, `subscription.created`,
    `subscription.active`, `subscription.paid`, `subscription.updated`
  - cancellation: `subscription.cancelled` (also `subscription.canceled`,
    `subscription.expired`)
- Copy the signing secret into `CREEM_WEBHOOK_SECRET`.

The route reads the signature from `creem-signature`, then
`x-creem-signature`, then `webhook-signature`. It returns **401** when the
signature is missing/invalid and **400** on invalid JSON, before any database
work.

## 4. Walk the sequence

Use a fresh test account (e.g. `paid-loop-test@example.com`).

1. **Sign up / log in** to the sandbox deployment.
2. **Start checkout.** On the pricing page or dashboard, click the Pro upgrade
   (or Team). The client calls `POST /api/checkout` with
   `{ "planType": "pro_monthly" }`; `createCheckoutSession` posts to
   `POST https://test-api.creem.io/v1/checkouts`.
   - Observe: browser is redirected to the Creem test checkout page.
3. **Complete checkout** with Creem's test card details.
   - Observe: browser returns to `<origin>/dashboard?checkout=success`.
4. **Webhook arrives.** Creem POSTs to `/api/webhooks/creem`.
   - Observe (server logs): HTTP 200 `{ "received": true }`; no 401/400/500.
   - Observe (DB), replacing `<email>` with the test account email:

     ```sql
     select s.id, s.user_id, s.plan_id, s.status,
            s.creem_subscription_id, s.creem_customer_id,
            s.current_period_start, s.current_period_end
     from subscriptions s
     join users u on u.id = s.user_id
     where u.email = '<email>'
     order by s.created_at desc
     limit 5;
     ```

     Expected: exactly one new row, `status = 'active'`,
     `creem_subscription_id` and `creem_customer_id` both non-null,
     `current_period_end` in the future.

   - Observe (DB):

     ```sql
     select id, creem_product_id, name, price_monthly
     from plans order by created_at desc limit 5;
     ```

     Expected: a `plans` row for the test product id with `name = 'Pro'`
     (or `'Team'`).

   - Observe (DB):

     ```sql
     select event_name, plan, metadata, created_at
     from analytics_events
     where event_name = 'checkout_completed'
     order by created_at desc limit 5;
     ```

     Expected: a `checkout_completed` row whose `metadata.subscriptionId`
     matches the subscription row.

   - *(Team leg only)* Observe (DB):

     ```sql
     select tw.id, tw.owner_id, tw.max_seats, tm.role, tm.status
     from team_workspaces tw
     join team_members tm on tm.team_id = tw.id
     where tw.owner_id = (select id from users where email = '<email>');
     ```

     Expected: one workspace with `max_seats = 5` and an `owner/accepted`
     member row.

5. **UI reflects the paid plan.**
   - Observe: the dashboard plan/quota badge shows **Pro** (or Team) and the
     free-report quota is replaced by unlimited usage (`QuotaIndicator`).
   - Observe: a **Manage subscription** control is present
     (`ManageSubscriptionButton`).
6. **Open the billing portal.** Click **Manage subscription**.
   - The client calls `POST /api/billing/portal`. With
     `subscriptions.creem_customer_id` set from step 4, no email fallback is
     needed; the route posts to `POST /customers/billing` and returns
     `{ "url": ... }`.
   - Observe: HTTP 200 with a `customer_portal_link`; the browser opens the
     Creem-hosted portal for the test customer.
   - To also exercise the fallback, temporarily clear `creem_customer_id` for
     the row and retry: the route calls
     `GET /customers?email=<account email>` and still resolves the id.
7. **Cancel in the portal.**
   - Observe: the portal shows the test subscription; cancel it there.
   - Observe (DB): Creem sends a cancellation webhook; the row's `status`
     becomes `'cancelled'`:

     ```sql
     select status, updated_at from subscriptions
     where creem_subscription_id = '<id from step 4>';
     ```

   - Observe (UI): after the webhook lands, the dashboard returns to the Free
     plan / free-report quota.

## 5. Failure signatures to watch

- **Checkout 503 "… product is not configured"** → `CREEM_PRODUCT_*` test ids
  are missing or set on the wrong environment.
- **Checkout 500 with a Creem error body** → `CREEM_API_URL` still points at
  production or the test key/product is wrong. Stop: this means the run may have
  touched production. Fix the env and retry with test values only.
- **Webhook 401** → `CREEM_WEBHOOK_SECRET` does not match the endpoint's
  signing secret, or the wrong header was forwarded by a proxy.
- **Portal 404 "No billing account found for this email yet."** → the webhook
  did not store `creem_customer_id`, or the email differs from the account
  email; check step 4's subscription row.
- **Portal 502** → `generateBillingPortalLink` failed (non-2xx or missing
  link); check `CREEM_API_URL`, key, and the server log.

## 6. What proves the gate is closed

All of:

1. A subscription row created by a real sandbox webhook with non-null
   `creem_subscription_id` and `creem_customer_id`.
2. The dashboard showing the paid plan.
3. `POST /api/billing/portal` returning a working `customer_portal_link`.
4. The cancellation webhook flipping the row to `cancelled` and the UI
   returning to Free.

Record the timestamps, the subscription id, and the observed statuses in
`docs/DEV_LOG.md`. Until then the paid loop remains unverified against the real
sandbox provider.
