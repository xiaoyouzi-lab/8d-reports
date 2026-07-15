-- Additive Guided Mode investigation ledger. This migration deliberately does
-- not alter legacy reports, report data, external shares, payments, or outputs.

CREATE TABLE IF NOT EXISTS "quality_case_guidance_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "task_link_id" uuid REFERENCES "quality_case_task_links"("id") ON DELETE SET NULL,
  "participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "mode" text NOT NULL DEFAULT 'guided',
  "language" text NOT NULL DEFAULT 'zh-CN',
  "status" text NOT NULL DEFAULT 'active',
  "prompt_policy_version" text NOT NULL,
  "retention_class" text NOT NULL DEFAULT 'case_audit',
  "retain_until" timestamp,
  "temporary_expires_at" timestamp,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "submitted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_sessions_case_created" ON "quality_case_guidance_sessions" ("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_sessions_task_link" ON "quality_case_guidance_sessions" ("task_link_id");
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_sessions_retention" ON "quality_case_guidance_sessions" ("retention_class", "retain_until");

CREATE TABLE IF NOT EXISTS "quality_case_guidance_ai_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "agent_type" text NOT NULL,
  "source_type" text NOT NULL,
  "prompt_identifier" text NOT NULL,
  "prompt_version" text NOT NULL,
  "prompt_input_hash" text NOT NULL,
  "model_identifier" text,
  "response" jsonb NOT NULL,
  "confidence" text NOT NULL,
  "request_metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "policy_outcome" text NOT NULL DEFAULT 'accepted',
  "generated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_ai_runs_case_generated" ON "quality_case_guidance_ai_runs" ("case_id", "generated_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_ai_runs_session_generated" ON "quality_case_guidance_ai_runs" ("session_id", "generated_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_ai_runs_agent_type" ON "quality_case_guidance_ai_runs" ("agent_type");

CREATE TABLE IF NOT EXISTS "quality_case_guidance_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "ai_run_id" uuid REFERENCES "quality_case_guidance_ai_runs"("id") ON DELETE SET NULL,
  "question_key" text NOT NULL,
  "question_version" text NOT NULL,
  "source_type" text NOT NULL,
  "stage" text NOT NULL,
  "category" text NOT NULL,
  "user_facing_question" text NOT NULL,
  "explanation" text,
  "quality_concepts" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "follow_up_rule_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "evidence_requirement_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_questions_session_created" ON "quality_case_guidance_questions" ("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_questions_case_key" ON "quality_case_guidance_questions" ("case_id", "question_key");

CREATE TABLE IF NOT EXISTS "quality_case_guidance_answers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "quality_case_guidance_questions"("id") ON DELETE CASCADE,
  "answer_group_id" uuid NOT NULL,
  "revision" integer NOT NULL DEFAULT 1,
  "supersedes_answer_id" uuid REFERENCES "quality_case_guidance_answers"("id") ON DELETE SET NULL,
  "source_type" text NOT NULL,
  "actor_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "actor_organization" text,
  "original_text" text NOT NULL,
  "language" text NOT NULL,
  "classification" text NOT NULL,
  "linked_quality_concepts" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "missing_information" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "follow_up_question_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "evidence_requirement_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("session_id", "answer_group_id", "revision")
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_answers_session_created" ON "quality_case_guidance_answers" ("session_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_answers_question_created" ON "quality_case_guidance_answers" ("question_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_answers_actor_id" ON "quality_case_guidance_answers" ("actor_id");

CREATE TABLE IF NOT EXISTS "quality_case_guidance_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "ai_run_id" uuid NOT NULL REFERENCES "quality_case_guidance_ai_runs"("id") ON DELETE CASCADE,
  "answer_id" uuid REFERENCES "quality_case_guidance_answers"("id") ON DELETE SET NULL,
  "insight_key" text NOT NULL,
  "kind" text NOT NULL,
  "severity" text NOT NULL,
  "source_type" text NOT NULL,
  "message" text NOT NULL,
  "suggested_question" text,
  "affected_concepts" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "evidence_requirement_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "confidence" text NOT NULL,
  "generated_at" timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp,
  "resolved_by" text REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_insights_session_generated" ON "quality_case_guidance_insights" ("session_id", "generated_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_insights_ai_run" ON "quality_case_guidance_insights" ("ai_run_id");

CREATE TABLE IF NOT EXISTS "quality_case_guidance_evidence_requirements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "question_id" uuid REFERENCES "quality_case_guidance_questions"("id") ON DELETE SET NULL,
  "answer_id" uuid REFERENCES "quality_case_guidance_answers"("id") ON DELETE SET NULL,
  "ai_run_id" uuid REFERENCES "quality_case_guidance_ai_runs"("id") ON DELETE SET NULL,
  "requirement_key" text NOT NULL,
  "source_type" text NOT NULL,
  "reason" text NOT NULL,
  "requirement_snapshot" jsonb NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "satisfied_at" timestamp,
  "satisfied_by" text REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_evidence_req_session_status" ON "quality_case_guidance_evidence_requirements" ("session_id", "status");
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_evidence_req_case_key" ON "quality_case_guidance_evidence_requirements" ("case_id", "requirement_key");

CREATE TABLE IF NOT EXISTS "quality_case_guidance_confirmations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "answer_id" uuid REFERENCES "quality_case_guidance_answers"("id") ON DELETE SET NULL,
  "confirmation_type" text NOT NULL,
  "decision" text NOT NULL,
  "comment" text,
  "actor_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_participant_id" uuid REFERENCES "quality_case_participants"("id") ON DELETE SET NULL,
  "actor_organization" text,
  "confirmed_snapshot" jsonb NOT NULL,
  "confirmed_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_confirmations_session_time" ON "quality_case_guidance_confirmations" ("session_id", "confirmed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_confirmations_answer_time" ON "quality_case_guidance_confirmations" ("answer_id", "confirmed_at" DESC);

CREATE TABLE IF NOT EXISTS "quality_case_guidance_field_mappings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "quality_cases"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "quality_case_guidance_sessions"("id") ON DELETE CASCADE,
  "answer_id" uuid NOT NULL REFERENCES "quality_case_guidance_answers"("id") ON DELETE CASCADE,
  "confirmation_id" uuid REFERENCES "quality_case_guidance_confirmations"("id") ON DELETE SET NULL,
  "quality_concept" text NOT NULL,
  "semantic_key" text NOT NULL,
  "target_reference" jsonb NOT NULL,
  "decision" text NOT NULL DEFAULT 'proposed',
  "decided_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "decided_at" timestamp,
  "decision_comment" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_mappings_session_decision" ON "quality_case_guidance_field_mappings" ("session_id", "decision");
CREATE INDEX IF NOT EXISTS "idx_qc_guidance_mappings_answer" ON "quality_case_guidance_field_mappings" ("answer_id");
