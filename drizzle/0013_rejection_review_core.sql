CREATE TABLE IF NOT EXISTS "rejection_review_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "anonymous_session_hash" text NOT NULL,
  "traffic_source" text NOT NULL DEFAULT 'direct',
  "source_type" text NOT NULL,
  "source_filename" text,
  "input_text" text NOT NULL,
  "input_hash" text NOT NULL,
  "status" text NOT NULL DEFAULT 'free_ready' CHECK ("status" IN ('free_ready', 'full_ready', 'analysis_failed')),
  "free_result_json" jsonb NOT NULL,
  "full_result_json" jsonb NOT NULL,
  "delivery_result_json" jsonb,
  "ai_policy_outcome" text NOT NULL DEFAULT 'rules_only',
  "analysis_failure_code" text,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "chk_rejection_review_tasks_source_type" CHECK ("source_type" IN ('paste', 'txt', 'docx'))
);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_tasks_session_created" ON "rejection_review_tasks" ("anonymous_session_hash", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_tasks_user_created" ON "rejection_review_tasks" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_tasks_expires_at" ON "rejection_review_tasks" ("expires_at");

CREATE TABLE IF NOT EXISTS "rejection_review_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL REFERENCES "rejection_review_tasks"("id") ON DELETE RESTRICT,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "provider_request_id" text NOT NULL UNIQUE,
  "provider_checkout_id" text UNIQUE,
  "provider_order_id" text UNIQUE,
  "provider_transaction_id" text UNIQUE,
  "provider_product_id" text,
  "price_variant" text NOT NULL DEFAULT 'deep_review' CHECK ("price_variant" IN ('instant_scan', 'deep_review')),
  "provider_mode" text NOT NULL DEFAULT 'test' CHECK ("provider_mode" IN ('test', 'production')),
  "checkout_url" text,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'disputed')),
  "customer_kind" text NOT NULL DEFAULT 'unknown' CHECK ("customer_kind" IN ('unknown', 'owner', 'test', 'external')),
  "expected_amount_cents" integer NOT NULL DEFAULT 9900 CHECK ("expected_amount_cents" >= 0),
  "paid_amount_cents" integer NOT NULL DEFAULT 0 CHECK ("paid_amount_cents" >= 0),
  "refunded_amount_cents" integer NOT NULL DEFAULT 0 CHECK ("refunded_amount_cents" >= 0),
  "currency" text NOT NULL DEFAULT 'USD' CHECK ("currency" = 'USD'),
  "failure_type" text,
  "qualification_status" text NOT NULL DEFAULT 'unverified' CHECK ("qualification_status" IN ('unverified', 'qualified', 'excluded_owner', 'excluded_test', 'excluded_friend', 'excluded_refund', 'excluded_dispute', 'excluded_incomplete_delivery')),
  "qualification_reason" text,
  "deliverable_ready_at" timestamp,
  "full_result_viewed_at" timestamp,
  "exported_at" timestamp,
  "paid_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_orders_task_created" ON "rejection_review_orders" ("task_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_orders_status_created" ON "rejection_review_orders" ("status", "created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_rejection_review_orders_active_task" ON "rejection_review_orders" ("task_id") WHERE "status" IN ('pending', 'processing', 'paid');

CREATE TABLE IF NOT EXISTS "rejection_review_entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL UNIQUE REFERENCES "rejection_review_tasks"("id") ON DELETE CASCADE,
  "order_id" uuid NOT NULL UNIQUE REFERENCES "rejection_review_orders"("id") ON DELETE RESTRICT,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'active', 'revoked')),
  "granted_at" timestamp NOT NULL DEFAULT now(),
  "revoked_at" timestamp,
  "revoke_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_entitlements_user_status" ON "rejection_review_entitlements" ("user_id", "status");

CREATE TABLE IF NOT EXISTS "rejection_review_funnel_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_name" text NOT NULL,
  "anonymous_session_hash" text NOT NULL,
  "actor_kind" text NOT NULL DEFAULT 'anonymous' CHECK ("actor_kind" IN ('anonymous', 'unknown', 'owner', 'test', 'external')),
  "traffic_source" text NOT NULL DEFAULT 'direct',
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "task_id" uuid REFERENCES "rejection_review_tasks"("id") ON DELETE SET NULL,
  "order_id" uuid REFERENCES "rejection_review_orders"("id") ON DELETE SET NULL,
  "failure_type" text,
  "duration_ms" integer,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "dedupe_key" text UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "chk_rejection_review_funnel_event_name" CHECK ("event_name" IN ('qualified_landing_view', 'review_upload_started', 'review_upload_completed', 'review_free_result_viewed', 'review_checkout_started', 'review_purchase_completed', 'review_full_result_viewed', 'review_delivered', 'review_refund_requested', 'review_repeat_purchase'))
);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_funnel_event_created" ON "rejection_review_funnel_events" ("event_name", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_funnel_actor_created" ON "rejection_review_funnel_events" ("actor_kind", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_rejection_review_funnel_session_created" ON "rejection_review_funnel_events" ("anonymous_session_hash", "created_at");
