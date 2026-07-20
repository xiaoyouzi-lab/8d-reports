import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const supplierUi = readFileSync(
  "src/components/quality-cases/SupplierGuidedTask.tsx",
  "utf8",
);
const supplierEvidenceRoute = readFileSync(
  "src/app/api/quality-case-tasks/[token]/evidence/route.ts",
  "utf8",
);
const supplierEvidenceDownloadRoute = readFileSync(
  "src/app/api/quality-case-tasks/[token]/evidence/[evidenceId]/route.ts",
  "utf8",
);
const guidanceService = readFileSync(
  "src/lib/quality-cases/guided-supplier.ts",
  "utf8",
);

// Both visible modes must reach the same external-task submit boundary, which
// in turn is the sole public entry for submitSupplierResponsePackage().
assert.match(supplierUi, /mode=\{expert \? "expert" : "guided"\}/);
assert.match(supplierUi, /action: "supplier_submit"/);
assert.match(supplierUi, /提交整改回复供内部审核/);
assert.doesNotMatch(supplierUi, /submitExternalQualityCaseTask/);

// Evidence has to be linked to a requirement/session on upload and removed
// from that same scoped session on delete; no browser-provided Case id is used.
assert.match(supplierUi, /form\.set\("requirementId", requirementId\)/);
assert.match(supplierEvidenceRoute, /getActiveSupplierGuidanceSession/);
assert.match(supplierEvidenceRoute, /createSupplierGuidanceEvidence/);
assert.match(supplierEvidenceRoute, /cleanupOrphanedR2Object/);
assert.match(supplierEvidenceRoute, /removeSupplierGuidanceEvidence/);
assert.doesNotMatch(supplierEvidenceRoute, /body\.caseId|form\.get\("caseId"/);
assert.match(guidanceService, /db\.batch\(\[\s*db\.insert\(qualityCaseEvidence\)[\s\S]*qualityCaseGuidanceEvidenceRequirements/);
assert.match(guidanceService, /getAuthorizedSupplierGuidanceEvidence/);
assert.match(supplierEvidenceDownloadRoute, /getAuthorizedSupplierGuidanceEvidence/);
assert.match(supplierEvidenceDownloadRoute, /getAuthorizedCustomerEvidence/);

console.log("Supplier Guided submission UI contract tests passed.");
