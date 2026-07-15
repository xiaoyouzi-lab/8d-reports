import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const foundation = readFileSync(
  resolve(root, "drizzle/0008_quality_case_foundation.sql"),
  "utf8",
);
const conversion = readFileSync(
  resolve(root, "drizzle/0009_p0_plus_quality_case_conversion.sql"),
  "utf8",
);
const authorizedResponse = readFileSync(
  resolve(root, "drizzle/0010_quality_case_task_authorized_response.sql"),
  "utf8",
);
const guidedInvestigation = readFileSync(
  resolve(root, "drizzle/0011_guided_quality_investigation.sql"),
  "utf8",
);
const guidedRollback = readFileSync(
  resolve(root, "drizzle/0011_guided_quality_investigation.rollback.sql"),
  "utf8",
);
const verification = readFileSync(resolve(root, "drizzle/0012_effectiveness_verification.sql"), "utf8");
const verificationRollback = readFileSync(resolve(root, "drizzle/0012_effectiveness_verification.rollback.sql"), "utf8");
const forwardCombined = `${foundation}\n${conversion}\n${authorizedResponse}\n${guidedInvestigation}\n${verification}`.toLowerCase();

assert.match(foundation, /^CREATE EXTENSION IF NOT EXISTS pgcrypto;/m);
for (const table of [
  "quality_cases",
  "quality_case_participants",
  "quality_case_outputs",
  "quality_case_versions",
  "quality_case_activities",
  "quality_case_task_links",
  "quality_case_evidence",
  "quality_case_texts",
]) {
  assert.match(
    foundation,
    new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`),
    `${table} must be created additively`,
  );
}
assert.match(foundation, /"token_hash" text NOT NULL UNIQUE/);
assert.match(foundation, /"visibility" text NOT NULL DEFAULT 'internal'/);
assert.match(
  conversion,
  /ADD COLUMN IF NOT EXISTS "converted_case_id" uuid REFERENCES "quality_cases"\("id"\) ON DELETE SET NULL/,
);
assert.match(
  authorizedResponse,
  /ADD COLUMN IF NOT EXISTS "authorized_response" jsonb/,
  "Customer task authorization snapshot must be additive",
);

const GUIDED_TABLES = [
  "quality_case_guidance_sessions",
  "quality_case_guidance_ai_runs",
  "quality_case_guidance_questions",
  "quality_case_guidance_answers",
  "quality_case_guidance_insights",
  "quality_case_guidance_evidence_requirements",
  "quality_case_guidance_confirmations",
  "quality_case_guidance_field_mappings",
];
for (const table of GUIDED_TABLES) {
  assert.match(
    guidedInvestigation,
    new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`),
    `${table} must be created additively`,
  );
  assert.match(
    guidedRollback,
    new RegExp(`DROP TABLE IF EXISTS "${table}"`),
    `${table} must be removed by the dedicated PR-G2 rollback`,
  );
}
assert.match(guidedInvestigation, /"prompt_identifier" text NOT NULL/);
assert.match(guidedInvestigation, /"prompt_version" text NOT NULL/);
assert.match(guidedInvestigation, /"response" jsonb NOT NULL/);
assert.match(guidedInvestigation, /"confidence" text NOT NULL/);
assert.match(guidedInvestigation, /"original_text" text NOT NULL/);
assert.match(guidedInvestigation, /"answer_group_id" uuid NOT NULL/);
assert.match(guidedInvestigation, /UNIQUE\("session_id", "answer_group_id", "revision"\)/);
assert.match(guidedInvestigation, /"confirmation_id" uuid REFERENCES "quality_case_guidance_confirmations"/);
assert.doesNotMatch(guidedInvestigation, /report_id|report_data|UPDATE\s+"reports"/i);
assert.doesNotMatch(forwardCombined, /\b(drop|truncate|delete\s+from|update\s+)/);
assert.doesNotMatch(forwardCombined, /alter table "(?:reports|users|team_members|team_workspaces)"/);
assert.doesNotMatch(guidedRollback, /"(?:quality_cases|reports|users|team_workspaces|quality_case_texts|quality_case_evidence)"/);
assert.doesNotMatch(guidedRollback, /\b(?:alter|truncate|delete\s+from|update\s+)/i);

for (const table of [
  "quality_case_verification_cycles", "quality_case_verification_plans", "quality_case_verification_executions",
  "quality_case_verification_results", "quality_case_verification_evidence", "quality_case_verification_reviews",
  "quality_case_verification_audits", "quality_case_verification_coach_runs",
]) {
  assert.match(verification, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`), `${table} must be additive`);
  assert.match(verificationRollback, new RegExp(`DROP TABLE IF EXISTS "${table}"`), `${table} must have a scoped rollback`);
}
assert.match(verification, /"evidence_id" uuid NOT NULL REFERENCES "quality_case_evidence"\("id"\) ON DELETE RESTRICT/);
assert.match(verification, /UNIQUE\("case_id", "cycle_number"\)/);
assert.match(verification, /"prompt_identifier" text NOT NULL/);
assert.match(verification, /"policy_outcome" text NOT NULL/);
assert.doesNotMatch(verification, /report_data|UPDATE\s+"reports"|ALTER TABLE\s+"reports"/i);
assert.doesNotMatch(verificationRollback, /"(?:quality_cases|quality_case_evidence|reports|users|team_workspaces)"/);
assert.doesNotMatch(verificationRollback, /\b(?:alter|truncate|delete\s+from|update\s+)/i);
