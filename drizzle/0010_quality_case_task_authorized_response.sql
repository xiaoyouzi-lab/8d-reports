ALTER TABLE "quality_case_task_links"
  ADD COLUMN IF NOT EXISTS "authorized_response" jsonb;
