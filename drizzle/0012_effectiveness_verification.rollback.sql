-- Roll back only PR-G7 effectiveness-verification data.
DROP TABLE IF EXISTS "quality_case_verification_coach_runs";
DROP TABLE IF EXISTS "quality_case_verification_audits";
DROP TABLE IF EXISTS "quality_case_verification_reviews";
DROP TABLE IF EXISTS "quality_case_verification_evidence";
DROP TABLE IF EXISTS "quality_case_verification_results";
DROP TABLE IF EXISTS "quality_case_verification_executions";
DROP TABLE IF EXISTS "quality_case_verification_plans";
DROP TABLE IF EXISTS "quality_case_verification_cycles";
