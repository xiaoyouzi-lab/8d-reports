import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildReportAccess,
  isWorkflowStatus,
  LOCKED_WORKFLOW_STATUSES,
  normalizeAssignableTeamRole,
  normalizeTeamRole,
  previewValue,
  WORKFLOW_STATUSES,
  type TeamRole,
} from "../src/lib/report-workflow";
import { aiUnavailableMessage, type AiTaskType } from "../src/lib/ai/deepseek";
import {
  isSupportedServiceRequestFile,
  isValidServiceContactEmail,
  MAX_SERVICE_REQUEST_FILES,
  normalizeServiceQuoteAmount,
} from "../src/lib/service-requests";

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
assert.equal(normalizeAssignableTeamRole("editor"), "editor");
assert.equal(normalizeAssignableTeamRole("viewer"), "viewer");
assert.equal(normalizeAssignableTeamRole("owner"), null);
assert.equal(normalizeAssignableTeamRole("unknown"), null);

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

const reportEditorPage = read("src/app/(app)/reports/[id]/page.tsx");
assert.match(reportEditorPage, /canEdit: false/, "Report editor should default to safe read-only permissions until the API returns real access");
assert.match(reportEditorPage, /canShare: false/, "Report editor should default to hidden share controls until the API returns real access");
assert.match(reportEditorPage, /canExportDraft: false/, "Report editor should default to hidden export controls until the API returns real access");
assert.match(reportEditorPage, /res\.status === 401/, "Report editor should handle unauthorized report loads explicitly");
assert.match(reportEditorPage, /setLoadError\("Report not found, or you do not have access to it\."\)/, "Report editor should not render a default editable report when access is missing");
assert.match(reportEditorPage, /Report unavailable/, "Report editor should show a safe unavailable state when the report cannot be loaded");
assert.match(reportEditorPage, /reportPermissions\.canEdit && \(\s*<AiReportTools/, "Report editor should hide AI draft/review tools for Viewers and locked reports");
assert.match(reportEditorPage, /reportPermissions\.canEdit && \(\s*<Button[\s\S]*Logo/, "Report editor should hide logo upload for Viewers and locked reports");
assert.match(reportEditorPage, /reportPermissions\.canShare && \(\s*<ShareDialog/, "Report editor should hide share management from Viewers");
assert.match(reportEditorPage, /reportPermissions\.canExportDraft && \(\s*<ExportMenu/, "Report editor should hide export controls from Viewers");
assert.match(reportEditorPage, /canEdit=\{reportPermissions\.canEdit\}/, "Report editor should pass edit access into step fields and evidence controls");
assert.match(reportEditorPage, /if \(reportPermissions\.canEdit\) \{\s*try \{\s*await saveToServer/, "Report editor should not silently save when a Viewer only changes steps");
assert.doesNotMatch(reportEditorPage, /pointer-events-none opacity-75/, "Read-only reports should still allow attachment preview and navigation");

const stepForm = read("src/components/report/StepForm.tsx");
assert.match(stepForm, /canEdit\?: boolean/, "Step form should accept explicit edit permission");
assert.match(stepForm, /readOnly=\{!canEdit\}/, "Step text fields should become read-only for Viewers");
assert.match(stepForm, /disabled=\{!canEdit\}/, "Step select fields should be disabled for Viewers");
assert.match(stepForm, /<AttachmentArea[\s\S]*canEdit=\{canEdit\}/, "Attachment controls should receive edit permission");
assert.match(stepForm, /<SignatureApprovalArea[\s\S]*canEdit=\{canEdit\}/, "Signature controls should receive edit permission");

const attachmentArea = read("src/components/report/AttachmentArea.tsx");
assert.match(attachmentArea, /canEdit = true/, "Attachment area should default to editable for existing callers");
assert.match(attachmentArea, /Attachments are view-only for your role/, "Attachment area should explain read-only evidence access");
assert.match(attachmentArea, /\{canEdit && \(\s*<button[\s\S]*handleDelete/, "Attachment delete controls should be hidden for Viewers");

const signatureArea = read("src/components/report/SignatureApprovalArea.tsx");
assert.match(signatureArea, /canEdit = true/, "Signature area should default to editable for existing callers");
assert.match(signatureArea, /Signature changes are not available for your role/, "Signature area should explain read-only approval access");

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
assert.match(teamRoute, /normalizeAssignableTeamRole/, "Team management API must only assign editor/viewer roles");
assert.match(teamRoute, /Role must be editor or viewer/, "Team management API must reject owner role assignment through raw API calls");
assert.doesNotMatch(teamRoute, /normalizeTeamRole\(body\.role\)/, "Team management API must not allow raw owner role assignment");
assert.match(teamRoute, /analyticsEvents/, "Team member operations should write lightweight audit events");
assert.match(teamRoute, /team_member_added/, "Team member additions must be logged");
assert.match(teamRoute, /team_member_role_changed/, "Team member role changes must be logged");
assert.match(teamRoute, /team_member_removed/, "Team member removals must be logged");
assert.match(teamRoute, /getTeamActivities/, "Team API should return recent team activity for the dashboard");

assert.equal(MAX_SERVICE_REQUEST_FILES, 5, "Service requests should keep a clear 5-file limit");
assert.equal(isValidServiceContactEmail("quality@example.com"), true, "Service request email validation should accept normal business emails");
assert.equal(isValidServiceContactEmail("quality"), false, "Service request email validation should reject invalid emails");
assert.equal(isSupportedServiceRequestFile({ name: "customer-template.docx", type: "" }), true, "Service request upload should accept supported files by extension when MIME is missing");
assert.equal(isSupportedServiceRequestFile({ name: "launch-package.zip", type: "application/x-zip-compressed" }), true, "Service request upload should accept common ZIP MIME types");
assert.equal(isSupportedServiceRequestFile({ name: "script.exe", type: "application/x-msdownload" }), false, "Service request upload should reject unsupported file types");
assert.equal(normalizeServiceQuoteAmount("999"), "999.00", "Service request quote should normalize whole-dollar amounts");
assert.equal(normalizeServiceQuoteAmount("$499.95"), "499.95", "Service request quote should normalize currency-style amounts");
assert.equal(normalizeServiceQuoteAmount("12.999"), null, "Service request quote should reject more than two decimals");

const templateRequestRoute = read("src/app/api/custom-template-requests/route.ts");
assert.match(templateRequestRoute, /isValidServiceContactEmail/, "Template Setup API must validate contact email server-side");
assert.match(templateRequestRoute, /isSupportedServiceRequestFile/, "Template Setup API must validate uploaded file type server-side");
assert.match(templateRequestRoute, /normalizeServiceQuoteAmount/, "Service admin API must validate quote amount server-side");

const dashboardPage = read("src/app/(app)/dashboard/page.tsx");
assert.match(dashboardPage, /Workflow/, "Dashboard report list should show workflow status, not only completion status");
assert.match(dashboardPage, /Rev\./, "Dashboard report list should show revision number");
assert.match(dashboardPage, /removeTeamMember/, "Dashboard Team workspace should let Owners remove members");
assert.match(dashboardPage, /method: "DELETE"/, "Dashboard member removal should call the Team DELETE API");
assert.match(dashboardPage, /Remove \$\{member\.name \|\| member\.email\}/, "Dashboard member removal should expose an accessible remove label");
assert.match(dashboardPage, /Team activity/, "Dashboard Team workspace should show recent Team activity");
assert.match(dashboardPage, /activity\.message/, "Dashboard Team activity should render human-readable audit messages");

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

const authConfig = read("src/lib/auth.ts");
assert.match(authConfig, /ENABLE_SOCIAL_LOGIN !== "true"/, "Social auth providers must be disabled unless explicitly enabled");
assert.match(authConfig, /socialProviders: getEnabledSocialProviders\(\)/, "Better Auth should use the gated social provider config");
assert.doesNotMatch(authConfig, /socialProviders:\s*\{\s*google:/, "Google auth must not be configured unconditionally");

console.log("Team governance verification passed.");
