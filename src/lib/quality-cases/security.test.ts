import assert from "node:assert/strict";
import { projectQualityCaseForExternalTask } from "@/lib/quality-cases/external-projection";
import {
  createQualityCaseTaskToken,
  hashQualityCaseTaskToken,
  isActiveQualityCaseTaskLink,
} from "@/lib/quality-cases/task-tokens";

const token = createQualityCaseTaskToken();
assert.ok(token.length >= 40, "task tokens must have enough entropy for external access");
assert.notEqual(token, createQualityCaseTaskToken());
assert.match(hashQualityCaseTaskToken(token), /^[a-f0-9]{64}$/);
assert.equal(isActiveQualityCaseTaskLink({
  revokedAt: null,
  expiresAt: new Date("2026-07-11T00:00:00.000Z"),
  now: new Date("2026-07-10T00:00:00.000Z"),
}), true);
assert.equal(isActiveQualityCaseTaskLink({
  revokedAt: new Date("2026-07-09T00:00:00.000Z"),
  expiresAt: new Date("2026-07-11T00:00:00.000Z"),
  now: new Date("2026-07-10T00:00:00.000Z"),
}), false);
assert.equal(isActiveQualityCaseTaskLink({
  revokedAt: null,
  completedAt: new Date("2026-07-09T00:00:00.000Z"),
  expiresAt: new Date("2026-07-11T00:00:00.000Z"),
  now: new Date("2026-07-10T00:00:00.000Z"),
}), false);

const sections = {
  case_summary: { title: "Visible case" },
  supplier_task: { fields: ["root_cause"] },
  supplier_evidence: [{ id: "evidence_1" }],
  customer_response: { rootCause: "Visible after internal review" },
  customer_evidence: [{ id: "evidence_2" }],
  customer_comments: [],
};

assert.deepEqual(projectQualityCaseForExternalTask("supplier_response", sections), {
  case_summary: { title: "Visible case" },
  supplier_task: { fields: ["root_cause"] },
  supplier_evidence: [{ id: "evidence_1" }],
});
assert.deepEqual(projectQualityCaseForExternalTask("customer_review", sections), {
  case_summary: { title: "Visible case" },
  customer_response: { rootCause: "Visible after internal review" },
  customer_evidence: [{ id: "evidence_2" }],
  customer_comments: [],
});
