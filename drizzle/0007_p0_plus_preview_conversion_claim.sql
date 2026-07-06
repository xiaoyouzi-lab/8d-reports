ALTER TABLE "p0_plus_previews"
  ADD COLUMN IF NOT EXISTS "conversion_claim_token" text,
  ADD COLUMN IF NOT EXISTS "conversion_claimed_at" timestamp,
  ADD COLUMN IF NOT EXISTS "conversion_claim_expires_at" timestamp;

CREATE INDEX IF NOT EXISTS "idx_p0_plus_previews_conversion_claim_expires_at"
  ON "p0_plus_previews" ("conversion_claim_expires_at");
