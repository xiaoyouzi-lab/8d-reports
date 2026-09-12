-- Additive revenue-sprint ledger. Subscription and legacy report entitlements
-- are deliberately unchanged.

CREATE TABLE IF NOT EXISTS "quality_case_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "preview_id" uuid NOT NULL UNIQUE REFERENCES "p0_plus_previews"("id") ON DELETE RESTRICT,
  "case_id" uuid UNIQUE REFERENCES "quality_cases"("id") ON DELETE SET NULL,
  "provider_checkout_id" text UNIQUE,
  "provider_transaction_id" text UNIQUE,
  "provider_request_id" text NOT NULL UNIQUE,
  "provider_product_id" text,
  "provider_mode" text NOT NULL DEFAULT 'test',
  "checkout_url" text,
  "status" text NOT NULL DEFAULT 'pending',
  "customer_kind" text NOT NULL DEFAULT 'external',
  "amount_subtotal_cents" integer NOT NULL DEFAULT 2900,
  "amount_paid_cents" integer NOT NULL DEFAULT 0,
  "refunded_amount_cents" integer NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'USD',
  "failure_code" text,
  "case_creation_claim_token" text,
  "case_creation_claim_expires_at" timestamp,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "paid_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_purchases_user" ON "quality_case_purchases" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_quality_case_purchases_status_created" ON "quality_case_purchases" ("status", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "quality_case_entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "purchase_id" uuid NOT NULL UNIQUE REFERENCES "quality_case_purchases"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "preview_id" uuid NOT NULL UNIQUE REFERENCES "p0_plus_previews"("id") ON DELETE RESTRICT,
  "case_id" uuid UNIQUE REFERENCES "quality_cases"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'active',
  "granted_at" timestamp NOT NULL DEFAULT now(),
  "revoked_at" timestamp,
  "revoke_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_entitlements_user_status" ON "quality_case_entitlements" ("user_id", "status");

CREATE TABLE IF NOT EXISTS "revenue_funnel_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_name" text NOT NULL,
  "funnel_id" text NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "preview_id" uuid REFERENCES "p0_plus_previews"("id") ON DELETE SET NULL,
  "purchase_id" uuid REFERENCES "quality_case_purchases"("id") ON DELETE SET NULL,
  "case_id" uuid REFERENCES "quality_cases"("id") ON DELETE SET NULL,
  "actor_kind" text NOT NULL DEFAULT 'anonymous',
  "failure_code" text,
  "duration_ms" integer,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "dedupe_key" text UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_revenue_funnel_event_created" ON "revenue_funnel_events" ("event_name", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_revenue_funnel_kind_created" ON "revenue_funnel_events" ("actor_kind", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_revenue_funnel_funnel_created" ON "revenue_funnel_events" ("funnel_id", "created_at");
