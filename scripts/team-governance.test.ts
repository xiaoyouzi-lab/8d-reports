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
import { aiUnavailableMessage, type AiTaskType } from "../src/lib/ai/deepseek";

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

const reportWorkflow = read("src/lib/report-workflow.ts");
assert.match(reportWorkflow, /isActiveTeamSubscription/, "Workspace role resolution must use active Team subscription checks");
assert.match(reportWorkflow, /innerJoin\(subscriptions, eq\(subscriptions\.userId, teamWorkspaces\.ownerId\)\)/, "Workspace role resolution must join owner subscriptions");
assert.match(reportWorkflow, /getPlanFromName\(row\.planName\) === "team"/, "Workspace role resolution must reject non-Team subscriptions");
assert.doesNotMatch(reportWorkflow, /select\(\{ role: teamMembers\.role \}\)\.from\(teamMembers\)\.where\(eq\(teamMembers\.userId, userId\)\)/, "Workspace role resolution must not use arbitrary stale membership rows");

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

const workflowPanel = read("src/components/report/ReportWorkflowPanel.tsx");
assert.match(workflowPanel, /oldValuePreview/, "Activity panel must show old value previews for auditability");
assert.match(workflowPanel, /newValuePreview/, "Activity panel must show new value previews for auditability");
assert.match(workflowPanel, /metadata\?\.filename/, "Activity panel must show attachment filenames from metadata");
assert.match(workflowPanel, /metadata\?\.format/, "Activity panel must show export format metadata");
assert.match(workflowPanel, /Reason:/, "Activity panel must show unlock reasons");

const reportsRoute = read("src/app/api/reports/route.ts");
assert.match(reportsRoute, /workflowStatus: reports\.workflowStatus/, "Dashboard report API must expose workflow status");
assert.match(reportsRoute, /revision: reports\.revision/, "Dashboard report API must expose revision number");
assert.match(reportsRoute, /lockedAt: reports\.lockedAt/, "Dashboard report API must expose lock state");

const teamRoute = read("src/app/api/team/route.ts");
assert.match(teamRoute, /requireActiveTeamOwner/, "Team management routes should use one active-Team-owner gate");
assert.match(teamRoute, /entitlements\.plan !== "team"/, "Team management must require an active Team plan");
assert.match(teamRoute, /export async function PATCH[\s\S]*requireActiveTeamOwner/, "Role updates must require an active Team owner");
assert.match(teamRoute, /export async function DELETE[\s\S]*requireActiveTeamOwner/, "Member removal must require an active Team owner");

const dashboardPage = read("src/app/(app)/dashboard/page.tsx");
assert.match(dashboardPage, /Workflow/, "Dashboard report list should show workflow status, not only completion status");
assert.match(dashboardPage, /Rev\./, "Dashboard report list should show revision number");

const appLayout = read("src/app/(app)/layout.tsx");
assert.match(appLayout, /Pro · Personal/, "App header should keep Pro positioned as personal use");

const pricingPage = read("src/app/(marketing)/pricing/page.tsx");
assert.match(pricingPage, /From \$499/, "Template Setup price should be From $499");
assert.match(pricingPage, /From \$999/, "Team Launch price should be From $999");
assert.doesNotMatch(pricingPage, /\$299/, "Current pricing page should not show old $299 template setup price");
assert.match(pricingPage, /Owner \/ Editor \/ Viewer roles/, "Pricing must describe implemented Team roles");
assert.match(pricingPage, /Approval status, report locking, and revisions/, "Pricing must describe implemented Team governance");
assert.match(pricingPage, /Unlimited personal reports/, "Pro copy should frame unlimited reports as individual/personal use");
assert.doesNotMatch(pricingPage, /Team collaboration/, "Pro pricing copy should not claim Team collaboration");
assert.doesNotMatch(pricingPage, /Audit trail & version history/, "Pro pricing copy should not claim Team governance");

const homepage = read("src/app/(marketing)/page.tsx");
assert.match(homepage, /Team is for controlled review, approval, and delivery/, "Homepage should emphasize current Team governance value");
assert.match(homepage, /AI Quality Check remains a beta assistant/, "Homepage AI copy should be framed as beta assistance");
assert.doesNotMatch(homepage, /AI report drafting is positioned as the next Pro expansion/, "Homepage should not over-position future AI drafting");

const englishMessages = read("src/messages/en.json");
assert.doesNotMatch(englishMessages, /Password protection coming soon/, "Docs FAQ should not promise password-protected share links before implementation");
assert.doesNotMatch(englishMessages, /Team collaboration/, "Pro message copy should not claim Team collaboration");
assert.doesNotMatch(englishMessages, /Audit trail & version history/, "Pro message copy should not claim Team governance");

const aiMessages: Record<AiTaskType, string> = {
  report_review: "AI Quality Check is temporarily unavailable. Your report is safely saved. Please try again later.",
  draft_generation: "AI Draft is temporarily unavailable. Your report is safely saved. Please try again later.",
  template_evaluation: "AI template evaluation is temporarily unavailable. Your request is safely saved. Please try again later.",
};
for (const [taskType, expected] of Object.entries(aiMessages) as Array<[AiTaskType, string]>) {
  assert.equal(aiUnavailableMessage(taskType), expected, `${taskType} should use a task-specific friendly failure message`);
}

const draftRoute = read("src/app/api/ai/draft-report/route.ts");
assert.match(draftRoute, /isAiBetaUser/, "AI Draft must remain beta gated");
assert.match(draftRoute, /getAccessibleReport\(reportId, user\.id\)/, "AI Draft must load only the requested accessible report");
assert.match(draftRoute, /summarizeMaterialsForAi\(materials, reportData\)/, "AI Draft input must be built from current report data and user-provided materials");
assert.doesNotMatch(draftRoute, /currentReportData/, "AI Draft API must not trust client-sent currentReportData");
assert.doesNotMatch(draftRoute, /getAccessibleUserIds|reports\/search|reportActivities/, "AI Draft must not read unrelated reports, search results, or activity history");

const loginForm = read("src/app/(auth)/login/login-form.tsx");
const signupForm = read("src/app/(auth)/signup/signup-form.tsx");
assert.doesNotMatch(loginForm, /signIn\.social|Google|GitHub|or continue with/, "Login page should not expose social login until it is stable");
assert.doesNotMatch(signupForm, /signIn\.social|Google|GitHub|or continue with/, "Signup page should not expose social login until it is stable");

console.log("Team governance verification passed.");
