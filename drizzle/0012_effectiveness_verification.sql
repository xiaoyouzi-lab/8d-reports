-- Additive effectiveness-verification ledger. It is intentionally isolated
-- from legacy ReportData, D0-D8, exports, billing, and share records.

CREATE TABLE IF NOT EXISTS "quality_case_verification_cycles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "cycle_number" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'verification_planning',
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp,
  UNIQUE("case_id", "cycle_number")
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_cycles_case_created" ON "quality_case_verification_cycles" ("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_cycles_status" ON "quality_case_verification_cycles" ("status");

CREATE TABLE IF NOT EXISTS "quality_case_verification_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cycle_id" uuid NOT NULL UNIQUE REFERENCES "quality_case_verification_cycles"("id") ON DELETE CASCADE,
  "method" text NOT NULL,
  "description" text NOT NULL,
  "owner_name" text NOT NULL,
  "organization" text NOT NULL,
  "planned_start_at" timestamp NOT NULL,
  "planned_end_at" timestamp NOT NULL,
  "due_at" timestamp NOT NULL,
  "sample_size" integer NOT NULL,
  "sample_scope" text NOT NULL,
  "acceptance_criteria" text NOT NULL,
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_plans_due" ON "quality_case_verification_plans" ("due_at");

CREATE TABLE IF NOT EXISTS "quality_case_verification_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cycle_id" uuid NOT NULL UNIQUE REFERENCES "quality_case_verification_cycles"("id") ON DELETE CASCADE,
  "executor_name" text NOT NULL,
  "executor_organization" text NOT NULL,
  "execution_start_at" timestamp NOT NULL,
  "execution_end_at" timestamp NOT NULL,
  "actual_scope" text NOT NULL,
  "execution_notes" text NOT NULL,
  "updated_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "quality_case_verification_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "execution_id" uuid NOT NULL UNIQUE REFERENCES "quality_case_verification_executions"("id") ON DELETE CASCADE,
  "result_summary" text NOT NULL,
  "actual_sample_size" integer NOT NULL,
  "pass_fail" text NOT NULL,
  "criteria_comparison" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "submitted_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "submitted_by_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "submitted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_results_status" ON "quality_case_verification_results" ("status");

CREATE TABLE IF NOT EXISTS "quality_case_verification_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "result_id" uuid NOT NULL REFERENCES "quality_case_verification_results"("id") ON DELETE CASCADE,
  "evidence_id" uuid NOT NULL REFERENCES "quality_case_evidence"("id") ON DELETE RESTRICT,
  "evidence_type" text NOT NULL,
  "description" text NOT NULL,
  "uploaded_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "uploaded_by_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "uploaded_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("result_id", "evidence_id")
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_evidence_result" ON "quality_case_verification_evidence" ("result_id");

CREATE TABLE IF NOT EXISTS "quality_case_verification_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "result_id" uuid NOT NULL REFERENCES "quality_case_verification_results"("id") ON DELETE CASCADE,
  "reviewer_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewer_organization" text NOT NULL,
  "decision" text NOT NULL,
  "comment" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_reviews_result_created" ON "quality_case_verification_reviews" ("result_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "quality_case_verification_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "cycle_id" uuid REFERENCES "quality_case_verification_cycles"("id") ON DELETE SET NULL,
  "actor_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "actor_organization" text,
  "actor_role" text NOT NULL,
  "action" text NOT NULL,
  "from_status" text,
  "to_status" text,
  "reason" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_audits_cycle_created" ON "quality_case_verification_audits" ("cycle_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_audits_case_created" ON "quality_case_verification_audits" ("case_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "quality_case_verification_coach_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "cycle_id" uuid NOT NULL REFERENCES "quality_case_verification_cycles"("id") ON DELETE CASCADE,
  "source_type" text NOT NULL,
  "prompt_identifier" text NOT NULL,
  "prompt_version" text NOT NULL,
  "prompt_input_hash" text NOT NULL,
  "model_identifier" text,
  "response" jsonb NOT NULL,
  "confidence" text NOT NULL,
  "policy_outcome" text NOT NULL,
  "generated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_verification_coach_cycle_generated" ON "quality_case_verification_coach_runs" ("cycle_id", "generated_at" DESC);
