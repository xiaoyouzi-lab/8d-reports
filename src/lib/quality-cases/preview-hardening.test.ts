import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQualityCaseInvitation, isValidInvitationEmail } from "./task-invitation-email";
import { cleanupOrphanedR2Object } from "../r2";

const expiry = new Date("2026-07-20T08:00:00.000Z");
const supplier = buildQualityCaseInvitation({
  type: "supplier_response",
  participantName: "Supplier <script>",
  participantOrganization: "Preview Parts",
  link: "https://preview.example/supplier/secure-token",
  expiresAt: expiry,
});
assert.match(supplier.subject, /质量整改调查邀请/);
assert.match(supplier.text, /https:\/\/preview\.example\/supplier\/secure-token/);
assert.doesNotMatch(supplier.html, /Supplier <script>/);
assert.match(supplier.html, /Supplier &lt;script&gt;/);

const customer = buildQualityCaseInvitation({
  type: "customer_review",
  participantName: "Customer Reviewer",
  participantOrganization: "Preview Customer",
  link: "https://preview.example/customer-review/secure-token",
  expiresAt: expiry,
});
assert.match(customer.subject, /Review Requested/);
assert.match(customer.text, /customer-review\/secure-token/);
assert.equal(isValidInvitationEmail("supplier@example.test"), true);
assert.equal(isValidInvitationEmail("not-an-email"), false);

async function main() {
  let removedKey = "";
  const cleanup = await cleanupOrphanedR2Object(
    "quality-cases/preview/orphan.pdf",
    "preview_test_database_failure",
    async (key) => {
      removedKey = key;
      return true;
    },
  );
  assert.equal(removedKey, "quality-cases/preview/orphan.pdf");
  assert.equal(cleanup.outcome, "deleted");

  const taskRoute = readFileSync("src/app/api/quality-cases/[id]/tasks/route.ts", "utf8");
  assert.match(taskRoute, /sendQualityCaseInvitation/);
  assert.match(taskRoute, /emailDelivery: "failed"/);
  assert.match(taskRoute, /VERCEL_URL/);
  const emailStatusRoute = readFileSync("src/app/api/debug/email-status/[id]/route.ts", "utf8");
  assert.match(emailStatusRoute, /isEmailDebugAvailable/);
  assert.match(emailStatusRoute, /getSessionUser/);
  assert.match(emailStatusRoute, /lastEvent/);
  const expireRoute = readFileSync("src/app/api/debug/quality-case-task-expire/[id]/route.ts", "utf8");
  assert.match(expireRoute, /isEmailDebugAvailable/);
  assert.match(expireRoute, /canAssignExternalTasks/);

  for (const route of [
    "src/app/api/quality-case-tasks/[token]/evidence/route.ts",
    "src/app/api/quality-cases/[id]/verification/evidence/route.ts",
    "src/app/api/verification-tasks/[token]/evidence/route.ts",
  ]) {
    const source = readFileSync(route, "utf8");
    assert.match(source, /objectUploaded = true/);
    assert.match(source, /cleanupOrphanedR2Object/);
  }

  console.log("RC-2 Preview hardening contract tests passed.");
}

void main();
