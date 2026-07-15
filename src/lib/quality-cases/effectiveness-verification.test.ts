import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assessVerificationReadiness,
  nextVerificationCycleNumber,
  validateVerificationCoachOutput,
  VERIFICATION_COACH_PROMPT,
} from "./effectiveness-verification";
import { getQualityCaseTransition, validateQualityCaseAction } from "./contract";

const completePlan = {
  method: "Leak test and outgoing inspection review",
  description: "Validate three consecutive production lots",
  ownerName: "Supplier QE",
  organization: "Supplier A",
  plannedStartAt: "2026-07-12",
  plannedEndAt: "2026-07-20",
  dueAt: "2026-07-22",
  sampleSize: 1500,
  sampleScope: "Three consecutive lots, 500 parts per lot, across two lines",
  acceptanceCriteria: "100% leak-test pass rate and no repeated defect",
};

// 1. Customer acceptance cannot close a Case.
assert.equal(getQualityCaseTransition("customer_accepted", "close_case"), null);
assert.equal(getQualityCaseTransition("effectiveness_verification", "close_case"), null);
assert.equal(getQualityCaseTransition("verified_effective", "close_case")?.to, "closed");

// 2. No plan means no valid path to a submitted result.
assert.ok(assessVerificationReadiness({ plan: null, evidenceCount: 0 }).missing.includes("Verification method"));
assert.equal(getQualityCaseTransition("verification_planning", "submit_verification"), null);

// 3. Missing evidence warns, but does not appear as missing required data.
const noEvidence = assessVerificationReadiness({ plan: completePlan, evidenceCount: 0 });
assert.equal(noEvidence.missing.length, 0);
assert.match(noEvidence.warnings.join(" "), /submission is allowed/i);

// 4. Only a human internal role may approve.
assert.equal(validateQualityCaseAction("internal_verification_review", { action: "approve_verification", actorRole: "coordinator", comment: "Evidence meets the criteria." }).ok, true);
assert.equal(validateQualityCaseAction("internal_verification_review", { action: "approve_verification", actorRole: "supplier", comment: "Approve" }).ok, false);
assert.equal(getQualityCaseTransition("internal_verification_review", "approve_verification")?.to, "verified_effective");

// 5. Failed verification reopens investigation rather than replacing history.
assert.equal(getQualityCaseTransition("internal_verification_review", "mark_verification_failed")?.to, "reopened");
assert.equal(nextVerificationCycleNumber([{ cycleNumber: 1 }]), 2);
assert.equal(nextVerificationCycleNumber([{ cycleNumber: 1 }, { cycleNumber: 3 }, { cycleNumber: 2 }]), 4);

// 6. Supplier cannot approve, close, or reopen.
for (const [status, action] of [["internal_verification_review", "approve_verification"], ["verified_effective", "close_case"], ["closed", "reopen_case"]] as const) {
  assert.equal(validateQualityCaseAction(status, { action, actorRole: "supplier", comment: "attempt" }).ok, false);
}

// 7. AI outputs carrying decisions or workflow mutations are rejected.
assert.equal(validateVerificationCoachOutput({ missing: ["Sample size"], warnings: [], suggestions: [] }), true);
for (const key of VERIFICATION_COACH_PROMPT.forbiddenOutputs) assert.equal(validateVerificationCoachOutput({ [key]: true }), false);

// 8. Persistence remains additive and separate from ReportData / D0-D8.
const source = readFileSync(resolve(process.cwd(), "src/lib/quality-cases/effectiveness-verification.ts"), "utf8");
const migration = readFileSync(resolve(process.cwd(), "drizzle/0012_effectiveness_verification.sql"), "utf8");
const externalTaskSource = readFileSync(resolve(process.cwd(), "src/lib/quality-cases/verification-tasks.ts"), "utf8");
assert.doesNotMatch(source, /reportData|\breports\b|D[0-8]/);
assert.doesNotMatch(migration, /report_data|ALTER TABLE\s+"reports"|UPDATE\s+"reports"/i);
assert.match(migration, /UNIQUE\("case_id", "cycle_number"\)/);
assert.match(migration, /"evidence_id" uuid NOT NULL REFERENCES "quality_case_evidence"/);
assert.match(externalTaskSource, /hashQualityCaseTaskToken\(token\)/, "Supplier tokens must be looked up by hash.");
assert.match(externalTaskSource, /eq\(qualityCaseVerificationCycles\.caseId, caseId\)/, "Cycle lookup must retain the Case boundary.");
assert.doesNotMatch(externalTaskSource, /approve_verification|close_case|reopen_case/, "Supplier task service must not expose internal decisions.");
