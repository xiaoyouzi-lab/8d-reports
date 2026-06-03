ALTER TABLE "user_quotas" ALTER COLUMN "total_quota" SET DEFAULT 3;

CREATE TABLE IF NOT EXISTS "ai_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "report_id" uuid REFERENCES "reports"("id") ON DELETE SET NULL,
  "task_type" text NOT NULL,
  "input_summary" text,
  "output" jsonb DEFAULT '{}',
  "status" text DEFAULT 'completed' NOT NULL,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_ai_tasks_user_id" ON "ai_tasks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_tasks_report_id" ON "ai_tasks" ("report_id");
CREATE INDEX IF NOT EXISTS "idx_ai_tasks_type" ON "ai_tasks" ("task_type");

CREATE TABLE IF NOT EXISTS "custom_template_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "company_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "template_use_case" text NOT NULL,
  "customer_requirements" text,
  "language_requirement" text,
  "expected_export_format" text,
  "uploaded_files" jsonb DEFAULT '[]',
  "ai_evaluation" jsonb DEFAULT '{}',
  "status" text DEFAULT 'submitted' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_custom_template_requests_user_id" ON "custom_template_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_custom_template_requests_created_at" ON "custom_template_requests" ("created_at" DESC);
