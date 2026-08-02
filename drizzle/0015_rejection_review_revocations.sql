CREATE TABLE IF NOT EXISTS "rejection_review_revocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_event_id" text NOT NULL UNIQUE,
  "kind" text NOT NULL,
  "provider_object_id" text NOT NULL,
  "provider_transaction_id" text NOT NULL,
  "provider_order_id" text,
  "provider_request_id" text,
  "provider_product_id" text,
  "amount_cents" integer,
  "currency" text,
  "reason" text,
  "matched_order_id" uuid REFERENCES "rejection_review_orders"("id") ON DELETE SET NULL,
  "processed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "chk_rejection_review_revocations_kind" CHECK ("kind" IN ('refund', 'dispute'))
);

CREATE INDEX IF NOT EXISTS "idx_rejection_review_revocations_transaction"
  ON "rejection_review_revocations" ("provider_transaction_id");
CREATE INDEX IF NOT EXISTS "idx_rejection_review_revocations_order"
  ON "rejection_review_revocations" ("provider_order_id");
CREATE INDEX IF NOT EXISTS "idx_rejection_review_revocations_request"
  ON "rejection_review_revocations" ("provider_request_id");
CREATE INDEX IF NOT EXISTS "idx_rejection_review_revocations_pending"
  ON "rejection_review_revocations" ("processed_at");
