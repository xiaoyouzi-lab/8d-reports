ALTER TABLE "custom_template_requests"
  ADD COLUMN IF NOT EXISTS "request_type" text DEFAULT 'template_setup' NOT NULL,
  ADD COLUMN IF NOT EXISTS "admin_notes" text,
  ADD COLUMN IF NOT EXISTS "quoted_amount" numeric(10, 2);

CREATE INDEX IF NOT EXISTS "idx_custom_template_requests_status" ON "custom_template_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_custom_template_requests_type" ON "custom_template_requests" ("request_type");
