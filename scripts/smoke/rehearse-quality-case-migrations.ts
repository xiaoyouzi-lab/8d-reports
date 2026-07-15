import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { configureSmokeDatabase } from "./smoke-safety";

const REQUIRED_TABLES = [
  "quality_cases",
  "quality_case_participants",
  "quality_case_outputs",
  "quality_case_versions",
  "quality_case_activities",
  "quality_case_task_links",
  "quality_case_evidence",
  "quality_case_texts",
  "quality_case_guidance_sessions",
  "quality_case_guidance_ai_runs",
  "quality_case_guidance_questions",
  "quality_case_guidance_answers",
  "quality_case_guidance_insights",
  "quality_case_guidance_evidence_requirements",
  "quality_case_guidance_confirmations",
  "quality_case_guidance_field_mappings",
  "quality_case_verification_cycles",
  "quality_case_verification_plans",
  "quality_case_verification_executions",
  "quality_case_verification_results",
  "quality_case_verification_evidence",
  "quality_case_verification_reviews",
  "quality_case_verification_audits",
  "quality_case_verification_coach_runs",
] as const;

const VERIFICATION_TABLES = [
  "quality_case_verification_cycles", "quality_case_verification_plans", "quality_case_verification_executions",
  "quality_case_verification_results", "quality_case_verification_evidence", "quality_case_verification_reviews",
  "quality_case_verification_audits", "quality_case_verification_coach_runs",
] as const;

const GUIDED_INVESTIGATION_TABLES = [
  "quality_case_guidance_sessions",
  "quality_case_guidance_ai_runs",
  "quality_case_guidance_questions",
  "quality_case_guidance_answers",
  "quality_case_guidance_insights",
  "quality_case_guidance_evidence_requirements",
  "quality_case_guidance_confirmations",
  "quality_case_guidance_field_mappings",
] as const;

/**
 * Split the reviewed, repository-owned SQL files without treating semicolons
 * inside quoted literals as statement terminators. This script never accepts
 * a user-provided file or database URL.
 */
export function splitSqlStatements(source: string) {
  const statements: string[] = [];
  let start = 0;
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quote) {
      if (character === quote && next === quote) {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }

    if (character === ";") {
      const statement = source.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }

  const trailing = source.slice(start).trim();
  if (trailing) statements.push(trailing);
  return statements;
}

function migrationStatements(filename: string) {
  const source = readFileSync(resolve(process.cwd(), filename), "utf8");
  const statements = splitSqlStatements(source);
  assert.ok(statements.length > 0, `${filename} must contain executable SQL.`);
  return statements;
}

async function applyStatements(
  sql: { query(statement: string): Promise<unknown> },
  statements: string[],
) {
  for (const statement of statements) {
    await sql.query(statement);
  }
}

async function resetQualityCaseMigrationBaseline(
  sql: { query(statement: string): Promise<unknown> },
) {
  // The workflow has already reset the disposable branch and initialized the
  // current schema. Remove only the new additive objects so the first pass
  // proves that these SQL files can create them from the legacy baseline.
  for (const table of [
    ...[...VERIFICATION_TABLES].reverse(),
    ...[...GUIDED_INVESTIGATION_TABLES].reverse(),
    "quality_case_texts",
    "quality_case_evidence",
    "quality_case_task_links",
    "quality_case_activities",
    "quality_case_versions",
    "quality_case_outputs",
    "quality_case_participants",
    "quality_cases",
  ]) {
    await sql.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
  }
  await sql.query('ALTER TABLE "p0_plus_previews" DROP COLUMN IF EXISTS "converted_case_id"');
}

async function main() {
  const summary = configureSmokeDatabase();
  const { neon } = await import("@neondatabase/serverless");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL was not configured after smoke safety checks.");
  const sql = neon(databaseUrl);
  const migrations = [
    "drizzle/0008_quality_case_foundation.sql",
    "drizzle/0009_p0_plus_quality_case_conversion.sql",
    "drizzle/0010_quality_case_task_authorized_response.sql",
    "drizzle/0011_guided_quality_investigation.sql",
    "drizzle/0012_effectiveness_verification.sql",
  ].map((filename) => ({ filename, statements: migrationStatements(filename) }));
  const guidedRollback = migrationStatements("drizzle/0011_guided_quality_investigation.rollback.sql");
  const verificationRollback = migrationStatements("drizzle/0012_effectiveness_verification.rollback.sql");

  await resetQualityCaseMigrationBaseline(sql);

  // The first pass is an initial migration from the legacy baseline. The
  // second proves the reviewed, additive SQL is safe to rerun on the same
  // disposable branch.
  for (const migration of migrations) await applyStatements(sql, migration.statements);
  for (const migration of migrations) await applyStatements(sql, migration.statements);

  const tables = await sql.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (${REQUIRED_TABLES.map((table) => `'${table}'`).join(", ")})
  `) as Array<{ table_name: string }>;
  assert.deepEqual(
    tables.map((table) => table.table_name).sort(),
    [...REQUIRED_TABLES].sort(),
    "All Quality Case tables must exist after the migration rehearsal.",
  );

  const extensions = await sql.query(
    "SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'",
  ) as Array<{ extname: string }>;
  assert.equal(extensions.length, 1, "pgcrypto must be available for UUID defaults.");

  const columns = await sql.query(`
    SELECT table_name, column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'quality_case_evidence' AND column_name = 'visibility')
        OR (table_name = 'p0_plus_previews' AND column_name = 'converted_case_id')
        OR (table_name = 'quality_case_task_links' AND column_name = 'authorized_response')
      )
  `) as Array<{ table_name: string; column_name: string; column_default: string | null }>;
  const evidenceVisibility = columns.find((column) => column.table_name === "quality_case_evidence");
  assert.match(
    evidenceVisibility?.column_default || "",
    /internal/i,
    "Quality Case evidence must default to internal visibility.",
  );
  assert.ok(
    columns.some((column) => column.table_name === "p0_plus_previews"),
    "P0+ previews must have the additive converted_case_id link.",
  );
  assert.ok(
    columns.some((column) => column.table_name === "quality_case_task_links"),
    "Customer task links must have an additive authorized-response snapshot.",
  );

  const guidedColumns = await sql.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'quality_case_guidance_sessions' AND column_name IN ('prompt_policy_version', 'retention_class'))
        OR (table_name = 'quality_case_guidance_answers' AND column_name IN ('answer_group_id', 'revision', 'original_text', 'supersedes_answer_id'))
        OR (table_name = 'quality_case_guidance_ai_runs' AND column_name IN ('agent_type', 'source_type', 'prompt_identifier', 'prompt_version', 'response', 'confidence', 'generated_at'))
        OR (table_name = 'quality_case_guidance_field_mappings' AND column_name IN ('confirmation_id', 'quality_concept', 'semantic_key', 'target_reference'))
      )
  `) as Array<{ table_name: string; column_name: string }>;
  for (const column of [
    "quality_case_guidance_sessions.prompt_policy_version",
    "quality_case_guidance_sessions.retention_class",
    "quality_case_guidance_answers.answer_group_id",
    "quality_case_guidance_answers.revision",
    "quality_case_guidance_answers.original_text",
    "quality_case_guidance_answers.supersedes_answer_id",
    "quality_case_guidance_ai_runs.agent_type",
    "quality_case_guidance_ai_runs.source_type",
    "quality_case_guidance_ai_runs.prompt_identifier",
    "quality_case_guidance_ai_runs.prompt_version",
    "quality_case_guidance_ai_runs.response",
    "quality_case_guidance_ai_runs.confidence",
    "quality_case_guidance_ai_runs.generated_at",
    "quality_case_guidance_field_mappings.confirmation_id",
    "quality_case_guidance_field_mappings.quality_concept",
    "quality_case_guidance_field_mappings.semantic_key",
    "quality_case_guidance_field_mappings.target_reference",
  ]) {
    const [tableName, columnName] = column.split(".");
    assert.ok(
      guidedColumns.some((item) => item.table_name === tableName && item.column_name === columnName),
      `Guided investigation column ${column} must exist after the migration rehearsal.`,
    );
  }

  const verificationColumns = await sql.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND (
      (table_name = 'quality_case_verification_cycles' AND column_name IN ('cycle_number', 'status', 'completed_at')) OR
      (table_name = 'quality_case_verification_plans' AND column_name IN ('sample_size', 'sample_scope', 'acceptance_criteria')) OR
      (table_name = 'quality_case_verification_results' AND column_name IN ('actual_sample_size', 'criteria_comparison', 'submitted_at')) OR
      (table_name = 'quality_case_verification_coach_runs' AND column_name IN ('prompt_identifier', 'prompt_version', 'response', 'policy_outcome'))
    )
  `) as Array<{ table_name: string; column_name: string }>;
  assert.equal(verificationColumns.length, 13, "PR-G7 verification columns must exist after migration rehearsal.");

  await applyStatements(sql, verificationRollback);
  const rolledBackVerification = await sql.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
      AND table_name IN (${VERIFICATION_TABLES.map((table) => `'${table}'`).join(", ")})
  `) as Array<{ table_name: string }>;
  assert.equal(rolledBackVerification.length, 0, "PR-G7 rollback must remove only verification tables.");
  const verificationUp = migrations.find((migration) => migration.filename.endsWith("0012_effectiveness_verification.sql"));
  assert.ok(verificationUp, "PR-G7 up migration must be included in rehearsal.");
  await applyStatements(sql, verificationUp.statements);

  // Down migration is intentionally limited to PR-G2's new ledger tables.
  // Reapply the up migration afterwards so downstream authenticated smoke
  // still receives the complete Quality Case schema on the disposable branch.
  await applyStatements(sql, guidedRollback);
  const rolledBackTables = await sql.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (${GUIDED_INVESTIGATION_TABLES.map((table) => `'${table}'`).join(", ")})
  `) as Array<{ table_name: string }>;
  assert.equal(rolledBackTables.length, 0, "PR-G2 rollback must remove only the Guided investigation ledger.");
  const retainedCaseTable = await sql.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quality_cases'
  `) as Array<{ table_name: string }>;
  assert.equal(retainedCaseTable.length, 1, "PR-G2 rollback must retain the existing Quality Case table.");
  const guidedUp = migrations.find((migration) => migration.filename.endsWith("0011_guided_quality_investigation.sql"));
  assert.ok(guidedUp, "PR-G2 up migration must be included in the rehearsal.");
  await applyStatements(sql, guidedUp.statements);

  console.log("Quality Case migration rehearsal passed", {
    database: summary,
    migrations: migrations.map(({ filename, statements }) => ({ filename, statements: statements.length })),
    rollbackStatements: guidedRollback.length,
    verificationRollbackStatements: verificationRollback.length,
    tables: REQUIRED_TABLES.length,
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Quality Case migration rehearsal failed");
  process.exit(1);
});
