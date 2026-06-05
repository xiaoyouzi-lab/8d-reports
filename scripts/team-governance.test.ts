import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildReportAccess,
  isWorkflowStatus,
  LOCKED_WORKFLOW_STATUSES,
  normalizeTeamRole,
  previewValue,
  WORKFLOW_STATUSES,
  type TeamRole,
} from "../src/lib/report-workflow";

const root = process.cwd();

function read(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

function access(role: TeamRole, workflowStatus = "draft", lockedAt: Date | null = null) {
  return buildReportAccess({ workflowStatus, lockedAt }, role);
}

assert.deepEqual(WORKFLOW_STATUSES, ["draft", "internal_review", "approved", "submitted", "closed"]);
for (const status of WORKFLOW_STATUSES) {
  assert.equal(isWorkflowStatus(status), true, `${status} should be a valid workflow status`);
}
assert.equal(isWorkflowStatus("completed"), false, "legacy completed status should not be a workflow status");

assert.equal(LOCKED_WORKFLOW_STATUSES.has("approved"), true);
assert.equal(LOCKED_WORKFLOW_STATUSES.has("submitted"), true);
assert.equal(LOCKED_WORKFLOW_STATUSES.has("closed"), true);
assert.equal(LOCKED_WORKFLOW_STATUSES.has("draft"), false);
assert.equal(LOCKED_WORKFLOW_STATUSES.has("internal_review"), false);

assert.equal(normalizeTeamRole("owner"), "owner");
assert.equal(normalizeTeamRole("editor"), "editor");
assert.equal(normalizeTeamRole("viewer"), "viewer");
assert.equal(normalizeTeamRole("unknown"), "editor");

assert.deepEqual(
  {
    canEdit: access("owner").canEdit,
    canManageWorkflow: access("owner").canManageWorkflow,
    canShare: access("owner").canShare,
    canExportDraft: access("owner").canExportDraft,
  },
  { canEdit: true, canManageWorkflow: true, canShare: true, canExportDraft: true },
  "Owner should have full draft access",
);

assert.deepEqual(
  {
    canEdit: access("editor").canEdit,
    canManageWorkflow: access("editor").canManageWorkflow,
    canShare: access("editor").canShare,
    canExportDraft: access("editor").canExportDraft,
  },
  { canEdit: true, canManageWorkflow: false, canShare: true, canExportDraft: true },
  "Editor should edit/share/export drafts but not manage workflow",
);

assert.deepEqual(
  {
    canEdit: access("viewer").canEdit,
    canManageWorkflow: access("viewer").canManageWorkflow,
    canShare: access("viewer").canShare,
    canExportDraft: access("viewer").canExportDraft,
  },
  { canEdit: false, canManageWorkflow: false, canShare: false, canExportDraft: false },
  "Viewer must remain view-only",
);

for (const status of ["approved", "submitted", "closed"]) {
  assert.equal(access("owner", status).locked, true, `${status} should lock reports`);
  assert.equal(access("owner", status).canEdit, false, `${status} should block owner edits`);
  assert.equal(access("editor", status).canEdit, false, `${status} should block editor edits`);
}
assert.equal(access("owner", "draft", new Date()).locked, true, "lockedAt should lock even a draft report");

const preview = previewValue("x".repeat(400));
assert.equal(preview?.length, 303, "Activity value previews should be truncated to 300 chars plus ellipsis");

const reportRoute = read("src/app/api/reports/[id]/route.ts");
assert.match(reportRoute, /access\.canEdit/, "Report save must use shared role and lock access gate");
assert.match(reportRoute, /report_field_updated/, "Report field updates must write Activity Log entries");
assert.match(reportRoute, /report_updated/, "Report metadata updates must write Activity Log entries");

const workflowRoute = read("src/app/api/reports/[id]/workflow/route.ts");
assert.match(workflowRoute, /entitlements\.plan !== "team"/, "Workflow governance must require Team plan");
assert.match(workflowRoute, /access\.canManageWorkflow/, "Only Owner should manage workflow transitions");
assert.match(workflowRoute, /A revision reason is required/, "Unlock must require a reason");
assert.match(workflowRoute, /revision: \(access\.report\.revision \|\| 0\) \+ 1/, "Unlock must increment revision");
assert.match(workflowRoute, /report_unlocked/, "Unlock must be logged");
assert.match(workflowRoute, /report_approved_or_locked/, "Approval/locking transition must be logged");

const attachmentsRoute = read("src/app/api/reports/[id]/attachments/route.ts");
assert.match(attachmentsRoute, /access\.canEdit/, "Attachment upload/delete must be blocked for locked reports and Viewers");
assert.match(attachmentsRoute, /attachment_uploaded/, "Attachment upload must be logged");
assert.match(attachmentsRoute, /attachment_deleted/, "Attachment delete must be logged");

const shareRoute = read("src/app/api/reports/[id]/share/route.ts");
assert.match(shareRoute, /access\.canShare/, "Share management must block Viewers");
assert.match(shareRoute, /share_link_created/, "Share creation must be logged");
assert.match(shareRoute, /share_link_revoked/, "Share revocation must be logged");

const activityRoute = read("src/app/api/reports/[id]/activity/route.ts");
assert.match(activityRoute, /report_exported/, "PDF/Word/ZIP exports must be loggable");
assert.match(activityRoute, /canExportDraft/, "Viewer export logging must be blocked");

const pricingPage = read("src/app/(marketing)/pricing/page.tsx");
assert.match(pricingPage, /From \$499/, "Template Setup price should be From $499");
assert.match(pricingPage, /From \$999/, "Team Launch price should be From $999");
assert.doesNotMatch(pricingPage, /\$299/, "Current pricing page should not show old $299 template setup price");
assert.match(pricingPage, /Owner \/ Editor \/ Viewer roles/, "Pricing must describe implemented Team roles");
assert.match(pricingPage, /Approval status, report locking, and revisions/, "Pricing must describe implemented Team governance");

console.log("Team governance verification passed.");
