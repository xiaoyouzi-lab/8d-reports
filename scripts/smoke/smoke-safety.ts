import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SAFE_DATABASE_PATTERN = /auth-smoke|smoke|test|testing|preview|local|localhost|127\.0\.0\.1|ci/i;
const PRODUCTION_PATTERN = /(^|[^a-z])prod([^a-z]|$)|production/i;

export interface SmokeDatabaseSummary {
  hasDatabaseUrl: boolean;
  protocol: string;
  isLocalhost: boolean;
  hostSuffix: string;
  databaseNameHint: string;
  usernameHint: string;
  hasPassword: boolean;
  branchIdHint: string;
  branchNameHint: string;
}

function hint(value: string, visible = 3) {
  if (!value) return "";
  return `${value.slice(0, visible)}***`;
}

function getDatabaseUrl() {
  return process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL || "";
}

function getBranchEvidence() {
  return [
    process.env.SMOKE_NEON_BRANCH_NAME,
    process.env.NEON_BRANCH_NAME,
    process.env.SMOKE_NEON_BRANCH_ID,
  ].filter((value): value is string => Boolean(value));
}

export function summarizeDatabaseUrl(raw = getDatabaseUrl()): SmokeDatabaseSummary {
  let protocol = "";
  let host = "";
  let dbName = "";
  let username = "";
  let hasPassword = false;

  try {
    if (raw) {
      const parsed = new URL(raw);
      protocol = parsed.protocol;
      host = parsed.hostname;
      dbName = parsed.pathname.replace("/", "");
      username = parsed.username;
      hasPassword = Boolean(parsed.password);
    }
  } catch {
    // Keep all fields redacted when the URL is malformed.
  }

  const branchId = process.env.SMOKE_NEON_BRANCH_ID || "";
  const branchName = process.env.SMOKE_NEON_BRANCH_NAME || process.env.NEON_BRANCH_NAME || "";

  return {
    hasDatabaseUrl: Boolean(raw),
    protocol,
    isLocalhost: host === "localhost" || host === "127.0.0.1",
    hostSuffix: host ? host.split(".").slice(-3).join(".") : "",
    databaseNameHint: hint(dbName),
    usernameHint: hint(username, 2),
    hasPassword,
    branchIdHint: hint(branchId, 6),
    branchNameHint: branchName ? `${branchName.slice(0, 18)}***` : "",
  };
}

function assertNoProductionEvidence(raw: string) {
  const branchEvidence = getBranchEvidence().join(" ");
  const branchIsExplicitSmoke = /auth-smoke|smoke|test|testing|preview|local|ci/i.test(branchEvidence);

  if (PRODUCTION_PATTERN.test(branchEvidence)) {
    throw new Error("Smoke database safety check failed: production-like branch evidence detected.");
  }

  if (!branchIsExplicitSmoke && PRODUCTION_PATTERN.test(raw)) {
    throw new Error("Smoke database safety check failed: production-like database or branch evidence detected.");
  }
}

function assertSmokeEvidence(raw: string) {
  const evidence = [raw, ...getBranchEvidence()].join(" ");
  const parentBranchId = process.env.NEON_PARENT_BRANCH_ID || "";
  const smokeBranchId = process.env.SMOKE_NEON_BRANCH_ID || "";

  if (!SAFE_DATABASE_PATTERN.test(evidence)) {
    throw new Error("Smoke database safety check failed: DATABASE_URL must be a smoke/test/preview/local database or branch.");
  }

  if (parentBranchId && smokeBranchId && parentBranchId === smokeBranchId) {
    throw new Error("Smoke database safety check failed: temporary branch id matches the configured parent branch id.");
  }
}

export function configureSmokeDatabase() {
  const raw = getDatabaseUrl();
  if (process.env.SMOKE_DB !== "true") {
    throw new Error("Refusing to run authenticated smoke: SMOKE_DB=true is required.");
  }

  if (!raw) {
    throw new Error("Refusing to run authenticated smoke: SMOKE_DATABASE_URL or DATABASE_URL is required.");
  }

  assertNoProductionEvidence(raw);
  assertSmokeEvidence(raw);

  process.env.DATABASE_URL = raw;
  process.env.SMOKE_DATABASE_URL = raw;

  return summarizeDatabaseUrl(raw);
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function writeGithubEnv(values: Record<string, string>) {
  const target = process.env.GITHUB_ENV;
  if (!target) return;

  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  appendFileSync(target, `${lines.join("\n")}\n`, { encoding: "utf8" });
}

export function maskGithubSecret(value: string) {
  if (!value || process.env.GITHUB_ACTIONS !== "true") return;
  process.stdout.write(`::add-mask::${value}\n`);
}

export function writeJsonFile(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, { encoding: "utf8" });
}
