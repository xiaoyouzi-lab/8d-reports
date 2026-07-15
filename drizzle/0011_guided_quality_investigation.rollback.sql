-- Roll back only the additive PR-G2 Guided investigation ledger.
-- This file is for a disposable migration rehearsal or an explicitly approved
-- rollback. It never touches legacy reports, users, workspaces, outputs, or
-- pre-PR-G2 Quality Case tables.

DROP TABLE IF EXISTS "quality_case_guidance_field_mappings";
DROP TABLE IF EXISTS "quality_case_guidance_confirmations";
DROP TABLE IF EXISTS "quality_case_guidance_evidence_requirements";
DROP TABLE IF EXISTS "quality_case_guidance_insights";
DROP TABLE IF EXISTS "quality_case_guidance_answers";
DROP TABLE IF EXISTS "quality_case_guidance_questions";
DROP TABLE IF EXISTS "quality_case_guidance_ai_runs";
DROP TABLE IF EXISTS "quality_case_guidance_sessions";
