ALTER TABLE "p0_plus_previews"
  ADD COLUMN IF NOT EXISTS "converted_case_id" uuid REFERENCES "quality_cases"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_p0_plus_previews_converted_case_id"
  ON "p0_plus_previews" ("converted_case_id");
