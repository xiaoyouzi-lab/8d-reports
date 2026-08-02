ALTER TABLE "rejection_review_orders"
  ADD COLUMN IF NOT EXISTS "price_variant" text NOT NULL DEFAULT 'deep_review';

ALTER TABLE "rejection_review_tasks"
  ADD COLUMN IF NOT EXISTS "delivery_result_json" jsonb;

ALTER TABLE "rejection_review_orders"
  ALTER COLUMN "expected_amount_cents" SET DEFAULT 9900;

ALTER TABLE "rejection_review_orders"
  DROP CONSTRAINT IF EXISTS "chk_rejection_review_orders_price_variant";

ALTER TABLE "rejection_review_orders"
  ADD CONSTRAINT "chk_rejection_review_orders_price_variant"
  CHECK ("price_variant" IN ('instant_scan', 'deep_review'));

ALTER TABLE "rejection_review_orders"
  DROP CONSTRAINT IF EXISTS "chk_rejection_review_orders_qualification_status";

ALTER TABLE "rejection_review_orders"
  ADD CONSTRAINT "chk_rejection_review_orders_qualification_status"
  CHECK ("qualification_status" IN (
    'unverified',
    'qualified',
    'excluded_owner',
    'excluded_test',
    'excluded_friend',
    'excluded_refund',
    'excluded_dispute',
    'excluded_incomplete_delivery'
  )) NOT VALID;

ALTER TABLE "rejection_review_funnel_events"
  DROP CONSTRAINT IF EXISTS "chk_rejection_review_funnel_event_name";

-- Enforce the Concierge-first event vocabulary for new rows without deleting
-- any legacy funnel evidence that may already exist.
ALTER TABLE "rejection_review_funnel_events"
  ADD CONSTRAINT "chk_rejection_review_funnel_event_name"
  CHECK ("event_name" IN (
    'qualified_landing_view',
    'review_upload_started',
    'review_upload_completed',
    'review_free_result_viewed',
    'review_checkout_started',
    'review_purchase_completed',
    'review_full_result_viewed',
    'review_delivered',
    'review_refund_requested',
    'review_repeat_purchase'
  )) NOT VALID;
