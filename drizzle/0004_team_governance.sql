ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "workflow_status" text NOT NULL DEFAULT 'draft';
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "revision" integer NOT NULL DEFAULT 0;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "locked_at" timestamp;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "locked_by" text REFERENCES "users"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "report_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "actor_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_name" text,
  "action_type" text NOT NULL,
  "entity_type" text NOT NULL DEFAULT 'report',
  "entity_id" text,
  "field_name" text,
  "old_value_preview" text,
  "new_value_preview" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "reason" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_report_activities_report_id" ON "report_activities" ("report_id");
CREATE INDEX IF NOT EXISTS "idx_report_activities_created_at" ON "report_activities" ("created_at" DESC);
