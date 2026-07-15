CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "quality_cases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" uuid REFERENCES "team_workspaces"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "output_type" text NOT NULL DEFAULT '8d',
  "priority" text NOT NULL DEFAULT 'medium',
  "waiting_on" text NOT NULL DEFAULT 'internal',
  "next_action" text NOT NULL DEFAULT 'Prepare the case before assigning a supplier task.',
  "assignee_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "due_at" timestamp,
  "current_version" integer NOT NULL DEFAULT 1,
  "case_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "closed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_cases_owner_id" ON "quality_cases" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_quality_cases_workspace_id" ON "quality_cases" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_quality_cases_status_due_at" ON "quality_cases" ("status", "due_at");
CREATE INDEX IF NOT EXISTS "idx_quality_cases_assignee_user_id" ON "quality_cases" ("assignee_user_id");
CREATE INDEX IF NOT EXISTS "idx_quality_cases_updated_at" ON "quality_cases" ("updated_at" DESC);

CREATE TABLE IF NOT EXISTS "quality_case_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "role" text NOT NULL,
  "display_name" text NOT NULL,
  "email" text,
  "organization_name" text,
  "is_internal" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_participants_case_id" ON "quality_case_participants" ("case_id");
CREATE INDEX IF NOT EXISTS "idx_quality_case_participants_user_id" ON "quality_case_participants" ("user_id");

CREATE TABLE IF NOT EXISTS "quality_case_outputs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "report_id" uuid REFERENCES "reports"("id") ON DELETE SET NULL,
  "output_type" text NOT NULL,
  "language_mode" text NOT NULL DEFAULT 'en',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_outputs_case_id" ON "quality_case_outputs" ("case_id");
CREATE INDEX IF NOT EXISTS "idx_quality_case_outputs_report_id" ON "quality_case_outputs" ("report_id");

CREATE TABLE IF NOT EXISTS "quality_case_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "snapshot" jsonb NOT NULL,
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("case_id", "version")
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_versions_case_version" ON "quality_case_versions" ("case_id", "version");

CREATE TABLE IF NOT EXISTS "quality_case_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "action_type" text NOT NULL,
  "actor_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_role" text NOT NULL,
  "actor_organization" text,
  "comment" text,
  "requested_field_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "due_at" timestamp,
  "diff" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "evidence_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_activities_case_created_at" ON "quality_case_activities" ("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_quality_case_activities_actor_id" ON "quality_case_activities" ("actor_id");

CREATE TABLE IF NOT EXISTS "quality_case_task_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "task_type" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "allowed_sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "completed_at" timestamp,
  "claimed_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_task_links_case_id" ON "quality_case_task_links" ("case_id");
CREATE INDEX IF NOT EXISTS "idx_quality_case_task_links_expires_at" ON "quality_case_task_links" ("expires_at");

CREATE TABLE IF NOT EXISTS "quality_case_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "uploaded_by_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "visibility" text NOT NULL DEFAULT 'internal',
  "storage_path" text NOT NULL,
  "filename" text NOT NULL,
  "mime_type" text,
  "file_size" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_evidence_case_id" ON "quality_case_evidence" ("case_id");

CREATE TABLE IF NOT EXISTS "quality_case_texts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "field_path" text NOT NULL,
  "original" jsonb NOT NULL,
  "ai_translation" jsonb,
  "confirmed_translation" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("case_id", "field_path")
);
CREATE INDEX IF NOT EXISTS "idx_quality_case_texts_case_id" ON "quality_case_texts" ("case_id");
CREATE INDEX IF NOT EXISTS "idx_quality_case_texts_case_field" ON "quality_case_texts" ("case_id", "field_path");
