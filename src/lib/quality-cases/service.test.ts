import assert from "node:assert/strict";
import {
  canBeQualityCaseAssignee,
  normalizeCoordinatorOrganization,
  normalizeQualityCaseOutputType,
  normalizeQualityCasePriority,
  normalizeQualityCaseTitle,
  summarizeQualityCaseQueues,
} from "@/lib/quality-cases/service";

assert.equal(normalizeQualityCaseTitle("  Connector plating issue\n"), "Connector plating issue");
assert.equal(normalizeQualityCaseTitle("\u0000"), "");
assert.equal(normalizeCoordinatorOrganization("  Ningbo Trading Co.  "), "Ningbo Trading Co.");
assert.equal(normalizeQualityCaseOutputType("scar"), "scar");
assert.equal(normalizeQualityCaseOutputType("unsafe"), "8d");
assert.equal(normalizeQualityCasePriority("critical"), "critical");
assert.equal(normalizeQualityCasePriority("urgent"), "medium");
assert.equal(canBeQualityCaseAssignee("owner"), true);
assert.equal(canBeQualityCaseAssignee("editor"), true);
assert.equal(canBeQualityCaseAssignee("viewer"), false);
assert.equal(canBeQualityCaseAssignee(null), false);

assert.deepEqual(summarizeQualityCaseQueues([
  { status: "internal_review", waitingOn: "internal", dueAt: new Date("2026-07-12T00:00:00.000Z") },
  { status: "waiting_for_supplier", waitingOn: "supplier", dueAt: new Date("2026-07-09T00:00:00.000Z") },
  { status: "customer_review", waitingOn: "customer", dueAt: new Date("2026-07-11T00:00:00.000Z") },
  { status: "changes_requested_from_supplier", waitingOn: "supplier", dueAt: null },
  { status: "effectiveness_verification", waitingOn: "internal", dueAt: null },
  { status: "closed", waitingOn: "none", dueAt: new Date("2026-07-01T00:00:00.000Z") },
], new Date("2026-07-10T00:00:00.000Z")), {
  awaitingInternalReview: 2,
  waitingForSupplier: 2,
  waitingForCustomer: 1,
  returned: 1,
  dueSoon: 2,
  overdue: 1,
  effectivenessVerification: 1,
  closed: 1,
});
