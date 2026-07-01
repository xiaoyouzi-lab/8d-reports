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
import {
  buildKnowledgeEntry,
  getKnowledgeTrustLabel,
  isKnowledgeEligibleReport,
  normalizeKnowledgeFilter,
  normalizeKnowledgeLimit,
  normalizeKnowledgePriorityFilter,
  normalizeKnowledgeQuery,
  normalizeKnowledgeReportTypeFilter,
  searchKnowledgeEntries,
} from "../src/lib/report-knowledge";
import { DEFAULT_REPORT_DATA, getKnowledgeReadinessSummary } from "../src/lib/report-steps";
import { aiUnavailableMessage, type AiTaskType } from "../src/lib/ai/deepseek";
import {
  isSupportedServiceRequestFile,
  isValidServiceContactEmail,
  MAX_SERVICE_REQUEST_FILES,
  normalizeServiceQuoteAmount,
  SERVICE_REQUEST_TYPES,
} from "../src/lib/service-requests";
import { revenueGeoResources } from "../src/content/revenue-geo-resources";

const root = process.cwd();

function read(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };

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

assert.equal(isKnowledgeEligibleReport({ status: "draft", workflowStatus: "draft" }), false, "Draft reports should not enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "in_progress", workflowStatus: "draft" }), false, "In-progress draft reports should not enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: "draft" }), true, "Legacy completed draft-workflow reports should enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: null }), true, "Legacy completed null-workflow reports should enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: "" }), true, "Legacy completed empty-workflow reports should enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: "internal_review" }), false, "Internal review reports should not enter Knowledge Base even if legacy status is completed");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: "approved" }), true, "Completed approved reports should enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: "submitted" }), true, "Completed submitted reports should enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "completed", workflowStatus: "closed" }), true, "Completed closed reports should enter Knowledge Base");
assert.equal(isKnowledgeEligibleReport({ status: "draft", workflowStatus: "approved" }), false, "Draft reports should not enter Knowledge Base even when workflow is approved");
assert.equal(isKnowledgeEligibleReport({ status: "in_progress", workflowStatus: "closed" }), false, "In-progress reports should not enter Knowledge Base even when workflow is closed");
assert.equal(isKnowledgeEligibleReport({ status: "in_progress", workflowStatus: "internal_review" }), false, "Internal review reports should not enter Knowledge Base");
assert.equal(getKnowledgeTrustLabel({ status: "completed", workflowStatus: "draft" }), "Completed", "Legacy completed draft-workflow reports should show Completed trust");
assert.equal(getKnowledgeTrustLabel({ status: "completed", workflowStatus: null }), "Completed", "Legacy completed null-workflow reports should show Completed trust");
assert.equal(getKnowledgeTrustLabel({ status: "completed", workflowStatus: "" }), "Completed", "Legacy completed empty-workflow reports should show Completed trust");
assert.equal(getKnowledgeTrustLabel({ status: "completed", workflowStatus: "approved" }), "Approved", "Approved workflow reports should show Approved trust");
assert.equal(getKnowledgeTrustLabel({ status: "completed", workflowStatus: "submitted" }), "Submitted", "Submitted workflow reports should show Submitted trust");
assert.equal(getKnowledgeTrustLabel({ status: "completed", workflowStatus: "closed" }), "Closed", "Closed workflow reports should show Closed trust");
assert.equal(normalizeKnowledgeFilter("submitted"), "submitted", "Knowledge Base should accept supported status filters");
assert.equal(normalizeKnowledgeFilter("unknown"), "all", "Knowledge Base should reject unsupported status filters safely");
assert.equal(normalizeKnowledgeReportTypeFilter("customer_8d"), "customer_8d", "Knowledge Base should accept supported report type filters");
assert.equal(normalizeKnowledgeReportTypeFilter("supplier_8d"), "all", "Knowledge Base should reject unsupported report type filters");
assert.equal(normalizeKnowledgePriorityFilter("critical"), "critical", "Knowledge Base should accept supported priority filters");
assert.equal(normalizeKnowledgePriorityFilter("urgent"), "all", "Knowledge Base should reject unsupported priority filters");
assert.equal(normalizeKnowledgeLimit(999), 50, "Knowledge Base should clamp large limits");
assert.equal(normalizeKnowledgeLimit(0), 1, "Knowledge Base should clamp low limits");
assert.equal(normalizeKnowledgeQuery("x".repeat(140)).length, 120, "Knowledge Base should bound query length");

const knowledgeFixture = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Paint blister customer 8D",
  status: "completed",
  workflowStatus: "approved",
  revision: 0,
  lockedAt: new Date("2026-06-01T00:00:00Z"),
  reportType: "customer_8d",
  priority: "high",
  source: "customer complaint",
  data: {
    reportNumber: "2026-06-001",
    problemDescription: "Paint blisters found after humidity exposure",
    confirmedRootCause: "Primer flash time was shortened below the approved process window.",
    selectedCorrectiveAction: "Restore flash time and add line clearance verification.",
    lessonsLearned: "Recipe changes require independent quality approval before release.",
  },
  createdAt: new Date("2026-06-01T00:00:00Z"),
  updatedAt: new Date("2026-06-02T00:00:00Z"),
};
const knowledgeEntry = buildKnowledgeEntry(knowledgeFixture);
assert.match(knowledgeEntry.rootCause || "", /Primer flash time/, "Knowledge entries should extract root cause text");
assert.match(knowledgeEntry.correctiveAction || "", /Restore flash time/, "Knowledge entries should extract corrective action text");
assert.match(knowledgeEntry.lessonsLearned || "", /independent quality approval/, "Knowledge entries should extract lessons learned text");
assert.equal(knowledgeEntry.trustLabel, "Approved", "Knowledge entries should expose the display trust label");
assert.equal(searchKnowledgeEntries([knowledgeFixture], { query: "humidity", filter: "all" }).length, 1, "Knowledge search should match completed report problem text");
assert.equal(searchKnowledgeEntries([knowledgeFixture], { query: "humidity", filter: "closed" }).length, 0, "Knowledge search should respect status filters");
assert.equal(searchKnowledgeEntries([knowledgeFixture], { query: "humidity", filter: "all", reportType: "customer_8d", priority: "high" }).length, 1, "Knowledge search should respect matching report type and priority filters");
assert.equal(searchKnowledgeEntries([knowledgeFixture], { query: "humidity", filter: "all", reportType: "internal_8d", priority: "high" }).length, 0, "Knowledge search should reject non-matching report type filters");
assert.equal(searchKnowledgeEntries([knowledgeFixture], { query: "humidity", filter: "all", reportType: "customer_8d", priority: "low" }).length, 0, "Knowledge search should reject non-matching priority filters");

const emptyReadiness = getKnowledgeReadinessSummary(DEFAULT_REPORT_DATA);
assert.deepEqual(
  emptyReadiness.items.map((item) => item.label),
  [
    "Root cause captured?",
    "Corrective action captured?",
    "Validation captured?",
    "Prevention/system change captured?",
    "Lessons learned captured?",
  ],
  "Knowledge readiness should track the five reusable-knowledge field groups",
);
assert.equal(emptyReadiness.items.every((item) => item.status === "Missing"), true, "Empty reports should show missing knowledge readiness");
assert.equal(emptyReadiness.missingCount, 5, "Empty reports should count all five knowledge groups as missing or weak");
assert.deepEqual(
  {
    hasRootCause: emptyReadiness.hasRootCause,
    hasCorrectiveAction: emptyReadiness.hasCorrectiveAction,
    hasValidation: emptyReadiness.hasValidation,
    hasPrevention: emptyReadiness.hasPrevention,
    hasLessonsLearned: emptyReadiness.hasLessonsLearned,
  },
  {
    hasRootCause: false,
    hasCorrectiveAction: false,
    hasValidation: false,
    hasPrevention: false,
    hasLessonsLearned: false,
  },
  "Empty readiness analytics flags should be booleans only, not content",
);
const partialReadiness = getKnowledgeReadinessSummary({
  ...DEFAULT_REPORT_DATA,
  selectedCorrectiveAction: "Use a verified corrective action from a prior report.",
});
assert.equal(
  partialReadiness.items.find((item) => item.key === "correctiveAction")?.status,
  "Needs detail",
  "Single-signal corrective action readiness should ask for more detail",
);
const readyReadiness = getKnowledgeReadinessSummary({
  ...DEFAULT_REPORT_DATA,
  confirmedRootCause: "Confirmed fixture cleaning miss.",
  rootCauseOccurrence: "Fixture cleaning was skipped.",
  selectedCorrectiveAction: "Add cleaning sign-off.",
  implementationPlan: "Update startup checklist.",
  validationMethod: "Layered audit.",
  validationResults: "Three audits passed.",
  systemChanges: "Control plan updated.",
  lessonsLearned: "Line-change controls need fixture verification.",
});
assert.equal(readyReadiness.items.every((item) => item.status === "Ready"), true, "Complete knowledge fields should be ready for future reuse");
assert.equal(readyReadiness.missingCount, 0, "Ready knowledge fields should not count as missing");

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
assert.match(reportEditorPage, /KnowledgeReusePanel/, "Report editor should render the Knowledge Reuse panel");
assert.match(reportEditorPage, /Reuse Knowledge/, "Report editor should expose a visible Knowledge Reuse entry");
assert.match(reportEditorPage, /knowledge_reuse_panel_opened/, "Report editor should track safe Knowledge Reuse panel opens");
assert.match(reportEditorPage, /source: "editor", location, plan/, "Report editor reuse analytics should use editor source, enum location, and plan only");
assert.match(reportEditorPage, /onOpenKnowledgeReuse=\{openKnowledgeReuse\}/, "Report editor should pass a panel opener into step forms for contextual hints");
assert.match(reportEditorPage, /getKnowledgeReadinessSummary/, "Report editor should calculate Knowledge readiness from current report data");
assert.match(reportEditorPage, /<KnowledgeReadinessPanel reportData=\{reportData\} reportId=\{reportId\} plan=\{plan\} \/>/, "Report editor should show the Knowledge readiness panel");
assert.match(reportEditorPage, /knowledgeReadiness=\{knowledgeReadiness\}/, "Report editor should pass readiness summary into workflow controls");
assert.match(reportEditorPage, /if \(reportPermissions\.canEdit\) \{\s*try \{\s*await saveToServer/, "Report editor should not silently save when a Viewer only changes steps");
assert.doesNotMatch(reportEditorPage, /pointer-events-none opacity-75/, "Read-only reports should still allow attachment preview and navigation");

const stepForm = read("src/components/report/StepForm.tsx");
assert.match(stepForm, /canEdit\?: boolean/, "Step form should accept explicit edit permission");
assert.match(stepForm, /readOnly=\{!canEdit\}/, "Step text fields should become read-only for Viewers");
assert.match(stepForm, /disabled=\{!canEdit\}/, "Step select fields should be disabled for Viewers");
assert.match(stepForm, /<AttachmentArea[\s\S]*canEdit=\{canEdit\}/, "Attachment controls should receive edit permission");
assert.match(stepForm, /<SignatureApprovalArea[\s\S]*canEdit=\{canEdit\}/, "Signature controls should receive edit permission");
assert.match(stepForm, /onOpenKnowledgeReuse\?:/, "Step form should accept a read-only Knowledge Reuse opener");
assert.match(stepForm, /Search past root causes before finalizing this section\./, "D4 should expose the required root-cause reuse hint");
assert.match(stepForm, /Reuse proven corrective actions from completed reports\./, "D5 should expose the required corrective-action reuse hint");
assert.match(stepForm, /Check prevention and system-change ideas from similar issues\./, "D7 should expose the required prevention reuse hint");
assert.match(stepForm, /Check lessons learned from similar completed reports\./, "D8 should expose the required lessons-learned reuse hint");
assert.doesNotMatch(stepForm, /lessons learned.*D7|D7.*lessons learned/i, "Step form should not imply lessons learned is a D7 field");

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
assert.match(workflowPanel, /href="\/knowledge"/, "Workflow panel should expose Knowledge Base near completion workflow controls");
assert.match(workflowPanel, /Completed and closed reports become reusable knowledge/, "Workflow panel should explain why completed reports feed the Knowledge Base");
assert.match(workflowPanel, /app_navigation_clicked/, "Workflow panel Knowledge Base link should use safe app navigation analytics");
assert.match(workflowPanel, /location: "workflow_panel"/, "Workflow panel analytics should use enum-like location metadata");
assert.match(workflowPanel, /knowledgeReadiness: KnowledgeReadinessSummary/, "Workflow panel should receive a precomputed Knowledge readiness summary");
assert.match(workflowPanel, /<KnowledgeReadinessPanel[\s\S]*summary=\{knowledgeReadiness\}/, "Workflow dialog should show the same Knowledge readiness summary");
assert.match(workflowPanel, /knowledge_readiness_warning_shown/, "Workflow panel should track weak-readiness warnings");
assert.match(
  workflowPanel,
  /This report can still be completed, but missing root cause, corrective action, validation, or lessons learned will make future knowledge reuse weaker\./,
  "Workflow panel should use the required non-blocking weak-readiness warning copy",
);
assert.match(workflowPanel, /toast\.warning[\s\S]*void updateWorkflow\(\{ workflowStatus: nextStatus \}\)/, "Readiness warning should not block the workflow request");

const reportsRoute = read("src/app/api/reports/route.ts");
assert.match(reportsRoute, /workflowStatus: reports\.workflowStatus/, "Dashboard report API must expose workflow status");
assert.match(reportsRoute, /revision: reports\.revision/, "Dashboard report API must expose revision number");
assert.match(reportsRoute, /lockedAt: reports\.lockedAt/, "Dashboard report API must expose lock state");

const knowledgeRoute = read("src/app/api/knowledge/search/route.ts");
assert.match(knowledgeRoute, /export async function POST/, "Knowledge search API must be POST-only");
assert.doesNotMatch(knowledgeRoute, /export async function GET/, "Knowledge search API must not expose GET");
assert.match(knowledgeRoute, /getSessionUser/, "Knowledge search must require an authenticated user");
assert.match(knowledgeRoute, /getAccessibleUserIds/, "Knowledge search must reuse Team report access scope");
assert.match(knowledgeRoute, /normalizeKnowledgeQuery/, "Knowledge search must safely normalize query text");
assert.match(knowledgeRoute, /body\.query \?\? body\.q/, "Knowledge search must support the documented query field while keeping q compatibility");
assert.match(knowledgeRoute, /eq\(reports\.status, "completed"\)/, "Knowledge search must include completed reports");
assert.match(knowledgeRoute, /KNOWLEDGE_WORKFLOW_STATUSES/, "Knowledge search must include locked workflow records");
assert.match(knowledgeRoute, /normalizeKnowledgeReportTypeFilter/, "Knowledge search must whitelist report type filters");
assert.match(knowledgeRoute, /normalizeKnowledgePriorityFilter/, "Knowledge search must whitelist priority filters");
assert.match(knowledgeRoute, /normalizeKnowledgeLimit/, "Knowledge search must clamp result limits");
assert.doesNotMatch(knowledgeRoute, /reportShares|accessToken/, "Knowledge search must not use external share tokens");

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

assert.equal(packageJson.scripts?.["test:auth-smoke"], "tsx scripts/authenticated-production-smoke.test.ts", "Package scripts should expose authenticated production smoke checks");
const authenticatedSmoke = read("scripts/authenticated-production-smoke.test.ts");
assert.match(authenticatedSmoke, /AUTH_SMOKE_OWNER_COOKIE/, "Authenticated smoke should require an Owner session cookie");
assert.match(authenticatedSmoke, /AUTH_SMOKE_EDITOR_COOKIE/, "Authenticated smoke should require an Editor session cookie");
assert.match(authenticatedSmoke, /AUTH_SMOKE_VIEWER_COOKIE/, "Authenticated smoke should require a Viewer session cookie");
assert.match(authenticatedSmoke, /AUTH_SMOKE_REPORT_ID/, "Authenticated smoke should require a shared test report id");
assert.match(authenticatedSmoke, /AUTH_SMOKE_MUTATE === "true"/, "Authenticated smoke should keep mutation checks opt-in");
assert.match(authenticatedSmoke, /viewer report update/, "Authenticated smoke should verify Viewer cannot update reports");
assert.match(authenticatedSmoke, /viewer workflow transition/, "Authenticated smoke should verify Viewer cannot change workflow");
assert.match(authenticatedSmoke, /viewer share create/, "Authenticated smoke should verify Viewer cannot create share links");
assert.match(authenticatedSmoke, /viewer attachment create/, "Authenticated smoke should verify Viewer cannot upload attachments");
assert.match(authenticatedSmoke, /viewer docx export/, "Authenticated smoke should verify Viewer cannot export Word");
assert.match(authenticatedSmoke, /editor workflow transition/, "Authenticated smoke should verify Editor cannot approve or lock reports");
assert.match(authenticatedSmoke, /report_approved_or_locked/, "Authenticated smoke mutation flow should verify approval Activity Log");
assert.match(authenticatedSmoke, /report_unlocked/, "Authenticated smoke mutation flow should verify unlock Activity Log");

assert.equal(packageJson.scripts?.["smoke:neon"], "tsx scripts/smoke/neon-branch.ts", "Package scripts should expose temporary Neon branch automation");
assert.equal(packageJson.scripts?.["smoke:db:reset"], "tsx scripts/smoke/reset-smoke-schema.ts", "Package scripts should expose temporary smoke schema reset");
assert.equal(packageJson.scripts?.["smoke:seed-auth"], "tsx scripts/smoke/seed-auth-smoke.ts", "Package scripts should expose authenticated smoke fixture seeding");
assert.equal(packageJson.scripts?.["smoke:auth"], "tsx scripts/smoke/authenticated-smoke.ts", "Package scripts should expose authenticated browser smoke");
assert.match(packageJson.scripts?.["smoke:auth:local"] || "", /SMOKE_DB=true/, "Local authenticated smoke should still require explicit smoke DB mode");

const authenticatedSmokeWorkflow = read(".github/workflows/authenticated-smoke.yml");
assert.match(authenticatedSmokeWorkflow, /workflow_dispatch:/, "Authenticated smoke workflow should be manually triggered");
assert.doesNotMatch(authenticatedSmokeWorkflow, /pull_request:/, "Authenticated smoke workflow must not run privileged Neon access on pull_request");
assert.match(authenticatedSmokeWorkflow, /secrets\.NEON_API_KEY/, "Authenticated smoke workflow should require NEON_API_KEY secret");
assert.match(authenticatedSmokeWorkflow, /vars\.NEON_PROJECT_ID/, "Authenticated smoke workflow should require explicit Neon project id var");
assert.match(authenticatedSmokeWorkflow, /vars\.NEON_PARENT_BRANCH_ID/, "Authenticated smoke workflow should require explicit Neon parent branch id var");
assert.match(authenticatedSmokeWorkflow, /vars\.NEON_DATABASE_NAME/, "Authenticated smoke workflow should require explicit Neon database name var");
assert.match(authenticatedSmokeWorkflow, /auth-smoke-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/, "Authenticated smoke workflow should create unique auth-smoke branches");
assert.match(authenticatedSmokeWorkflow, /npm run smoke:neon -- create/, "Authenticated smoke workflow should create a temporary Neon branch");
assert.match(authenticatedSmokeWorkflow, /npm run smoke:db:reset[\s\S]*npx drizzle-kit push --force[\s\S]*npm run smoke:seed-auth/, "Authenticated smoke workflow should reset cloned branch before schema init and seeding");
assert.match(authenticatedSmokeWorkflow, /npm run dev -- --hostname 127\.0\.0\.1 --port 3028/, "Authenticated smoke workflow should run the local app in dev mode for non-secure local auth cookies");
assert.match(authenticatedSmokeWorkflow, /if: always\(\)[\s\S]*Delete temporary Neon branch[\s\S]*npm run smoke:neon -- delete/, "Authenticated smoke workflow should delete temporary Neon branch even after failures");
assert.match(authenticatedSmokeWorkflow, /SMOKE_RESULT_PATH: output\/authenticated-smoke-result\.json/, "Authenticated smoke workflow should save a bounded smoke artifact");
assert.match(authenticatedSmokeWorkflow, /AUTH_SECRET="\$\(openssl rand -hex 32\)"/, "Authenticated smoke workflow should generate the Better Auth runtime secret into a variable");
assert.match(authenticatedSmokeWorkflow, /echo "::add-mask::\$AUTH_SECRET"[\s\S]*printf 'BETTER_AUTH_SECRET=%s\\n' "\$AUTH_SECRET" >> "\$GITHUB_ENV"/, "Authenticated smoke workflow should mask the generated Better Auth secret before writing it to GitHub env");
assert.match(authenticatedSmokeWorkflow, /AI_BETA_EMAILS=smoke-owner@example\.test/, "Authenticated smoke workflow should beta-gate the smoke owner for AI Quality Check without using a real AI key");
assert.doesNotMatch(authenticatedSmokeWorkflow, /BETTER_AUTH_SECRET=\$\(openssl rand -hex 32\)/, "Authenticated smoke workflow must not write an unmasked generated Better Auth secret directly to GitHub env");
assert.doesNotMatch(authenticatedSmokeWorkflow, /DEEPSEEK_API_KEY/, "Authenticated smoke workflow must not require a real AI provider key");

const smokeSafety = read("scripts/smoke/smoke-safety.ts");
assert.match(smokeSafety, /SMOKE_DB !== "true"/, "Smoke scripts must fail closed unless SMOKE_DB=true");
assert.match(smokeSafety, /SMOKE_DATABASE_URL \|\| process\.env\.DATABASE_URL/, "Smoke scripts should use explicit smoke database URL handling");
assert.match(smokeSafety, /NEON_PARENT_BRANCH_ID/, "Smoke safety must compare temporary branch id with parent branch id");
assert.match(smokeSafety, /auth-smoke\|smoke\|test\|testing\|preview\|local\|localhost/, "Smoke safety should require safe database or branch evidence");
assert.match(smokeSafety, /production-like/, "Smoke safety should reject production-like database use without explicit smoke branch evidence");
assert.doesNotMatch(smokeSafety, /dotenv\/config/, "Smoke safety must not load local .env implicitly");
assert.match(smokeSafety, /add-mask/, "Smoke safety should support GitHub masking for sensitive values");

const neonSmokeBranch = read("scripts/smoke/neon-branch.ts");
assert.match(neonSmokeBranch, /https:\/\/console\.neon\.tech\/api\/v2/, "Neon smoke helper should use the Neon API");
assert.match(neonSmokeBranch, /NEON_API_KEY/, "Neon smoke helper should require NEON_API_KEY");
assert.match(neonSmokeBranch, /NEON_PROJECT_ID/, "Neon smoke helper should require NEON_PROJECT_ID");
assert.match(neonSmokeBranch, /NEON_PARENT_BRANCH_ID/, "Neon smoke helper should require NEON_PARENT_BRANCH_ID");
assert.match(neonSmokeBranch, /NEON_DATABASE_NAME/, "Neon smoke helper should require NEON_DATABASE_NAME");
assert.match(neonSmokeBranch, /parent_id: parentBranchId/, "Neon smoke helper should create the branch from the configured parent branch");
assert.match(neonSmokeBranch, /branch\.id === parentBranchId/, "Neon smoke helper must refuse parent-branch use");
assert.match(neonSmokeBranch, /SMOKE_DB: "true"/, "Neon smoke helper should export SMOKE_DB=true for subsequent steps");
assert.match(neonSmokeBranch, /SMOKE_DATABASE_URL/, "Neon smoke helper should export the temporary connection URL without logging it directly");
assert.match(neonSmokeBranch, /method: "DELETE"/, "Neon smoke helper should support branch deletion");
assert.doesNotMatch(neonSmokeBranch, /dotenv\/config/, "Neon smoke helper must not load local .env implicitly");

const resetSmokeSchema = read("scripts/smoke/reset-smoke-schema.ts");
assert.match(resetSmokeSchema, /configureSmokeDatabase/, "Smoke schema reset should run safety checks first");
assert.match(resetSmokeSchema, /DROP SCHEMA IF EXISTS public CASCADE/, "Smoke schema reset should clear cloned branch data");
assert.match(resetSmokeSchema, /CREATE SCHEMA public/, "Smoke schema reset should recreate public schema");
assert.doesNotMatch(resetSmokeSchema, /dotenv\/config/, "Smoke schema reset must not load local .env implicitly");

const seedAuthSmoke = read("scripts/smoke/seed-auth-smoke.ts");
assert.match(seedAuthSmoke, /configureSmokeDatabase/, "Authenticated seed should run smoke DB safety checks first");
assert.match(seedAuthSmoke, /signUpEmail/, "Authenticated seed should create users through Better Auth email sign-up");
assert.match(seedAuthSmoke, /Smoke Owner/, "Authenticated seed should create a smoke owner");
assert.match(seedAuthSmoke, /Smoke Member/, "Authenticated seed should create a smoke team member");
assert.match(seedAuthSmoke, /Smoke Outsider/, "Authenticated seed should create an outsider for access-boundary checks");
assert.match(seedAuthSmoke, /role: "owner"/, "Authenticated seed should add Team owner membership");
assert.match(seedAuthSmoke, /role: "editor"/, "Authenticated seed should add Team editor membership");
assert.match(seedAuthSmoke, /status: "completed"[\s\S]*workflowStatus: "draft"/, "Authenticated seed should include legacy completed draft-workflow report");
assert.match(seedAuthSmoke, /Customer found coating peel-off on brake bracket batch KB-001\./, "Authenticated seed should use the required completed-report problem fixture");
assert.match(seedAuthSmoke, /Fixture cleaning check was skipped before line change\./, "Authenticated seed should use the required occurrence root-cause fixture");
assert.match(seedAuthSmoke, /Outgoing inspection did not check coating edge adhesion\./, "Authenticated seed should use the required escape root-cause fixture");
assert.match(seedAuthSmoke, /Add mandatory fixture cleaning sign-off before production restart\./, "Authenticated seed should use the required corrective-action fixture");
assert.match(seedAuthSmoke, /Line-change controls must include fixture cleaning verification\./, "Authenticated seed should use the required lessons-learned fixture");
assert.match(seedAuthSmoke, /workflowStatus: "closed"/, "Authenticated seed should include closed report");
assert.match(seedAuthSmoke, /status: "draft"/, "Authenticated seed should include draft exclusion fixture");
assert.match(seedAuthSmoke, /SMOKE_DRAFT_REPORT_ID/, "Authenticated seed should export a draft report id for readiness smoke");
assert.match(seedAuthSmoke, /rootCauseOccurrence: ""[\s\S]*confirmedRootCause: ""[\s\S]*selectedCorrectiveAction: ""[\s\S]*validationResults: ""[\s\S]*systemChanges: ""[\s\S]*lessonsLearned: ""/, "Authenticated seed should keep the draft fixture weak for Knowledge readiness smoke");
assert.match(seedAuthSmoke, /status: "in_progress"/, "Authenticated seed should include in-progress exclusion fixture");
assert.match(seedAuthSmoke, /workflowStatus: "internal_review"/, "Authenticated seed should include internal-review exclusion fixture");
assert.match(seedAuthSmoke, /Outsider Visible Risk/, "Authenticated seed should include outsider report fixture");
assert.match(seedAuthSmoke, /Member Approved Internal 8D/, "Authenticated seed should include accessible Team member approved internal 8D fixture");
assert.doesNotMatch(seedAuthSmoke, /dotenv\/config/, "Authenticated seed must not load local .env implicitly");

const authenticatedBrowserSmoke = read("scripts/smoke/authenticated-smoke.ts");
assert.match(authenticatedBrowserSmoke, /configureSmokeDatabase/, "Authenticated browser smoke should run smoke DB safety checks first");
assert.match(authenticatedBrowserSmoke, /resultPath = process\.env\.SMOKE_RESULT_PATH \|\| "output\/authenticated-smoke-result\.json"/, "Authenticated browser smoke should have a default smoke result artifact path");
assert.match(authenticatedBrowserSmoke, /completedSteps/, "Authenticated browser smoke should track completed steps for failure diagnostics");
assert.match(authenticatedBrowserSmoke, /failedStep/, "Authenticated browser smoke should track the failed step for failure diagnostics");
assert.match(authenticatedBrowserSmoke, /smokeStep\("knowledge search fixture cleaning"/, "Authenticated browser smoke should name specific Knowledge search steps");
assert.match(authenticatedBrowserSmoke, /smokeStep\("analytics payload safety"/, "Authenticated browser smoke should name analytics payload safety checks");
assert.match(authenticatedBrowserSmoke, /caseInsensitive\?: boolean/, "Authenticated browser smoke should support targeted case-insensitive text waits");
assert.match(authenticatedBrowserSmoke, /waitForBodyText\(page, "What to do next", \{ caseInsensitive: true \}\)/, "Dashboard heading smoke assertion should tolerate uppercase rendering without changing product copy");
assert.match(authenticatedBrowserSmoke, /safeBodyExcerpt/, "Authenticated browser smoke should include a bounded body excerpt for UI timeouts");
assert.match(authenticatedBrowserSmoke, /redactSensitiveText/, "Authenticated browser smoke should redact sensitive diagnostic text");
assert.match(authenticatedBrowserSmoke, /REDACTED_ARTIFACT_TERMS/, "Authenticated browser smoke should list fixture terms that must not leak into artifacts");
assert.match(authenticatedBrowserSmoke, /writeSmokeResult\("passed"/, "Authenticated browser smoke should write a success artifact");
assert.match(authenticatedBrowserSmoke, /writeSmokeResult\("failed"/, "Authenticated browser smoke should write a failure artifact before exiting");
assert.match(authenticatedBrowserSmoke, /capturedEventNames/, "Authenticated browser smoke artifacts should include event names rather than full payload values");
assert.match(authenticatedBrowserSmoke, /\/dashboard[\s\S]*\/login/, "Authenticated smoke should verify unauthenticated dashboard redirect");
assert.match(authenticatedBrowserSmoke, /\/knowledge[\s\S]*\/login/, "Authenticated smoke should verify unauthenticated Knowledge redirect");
assert.match(authenticatedBrowserSmoke, /GET \/api\/knowledge\/search should be 405/, "Authenticated smoke should verify Knowledge GET is blocked");
assert.match(authenticatedBrowserSmoke, /Unauthenticated POST \/api\/knowledge\/search should be 401/, "Authenticated smoke should verify unauthenticated Knowledge POST is blocked");
assert.match(authenticatedBrowserSmoke, /Dashboard[\s\S]*Knowledge Base[\s\S]*New Report/, "Authenticated smoke should verify app navigation labels");
assert.match(authenticatedBrowserSmoke, /Turn each completed 8D into reusable quality knowledge/, "Authenticated smoke should verify Dashboard guidance");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - Coating Peel-off/, "Authenticated smoke should verify completed report enters Knowledge Base");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - Closed Bearing Noise/, "Authenticated smoke should verify closed report enters Knowledge Base");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - Member Approved Internal 8D/, "Authenticated smoke should verify Team member approved knowledge is visible to owner");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - Draft Containment/, "Authenticated smoke should verify draft exclusion");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - In Progress Torque/, "Authenticated smoke should verify in-progress exclusion");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - Internal Review Leak/, "Authenticated smoke should verify internal-review exclusion");
assert.match(authenticatedBrowserSmoke, /KB Smoke Test - Outsider Visible Risk/, "Authenticated smoke should verify outsider report exclusion");
assert.match(authenticatedBrowserSmoke, /search\.fill\("coating"\)/, "Authenticated smoke should search for coating");
assert.match(authenticatedBrowserSmoke, /search\.fill\("fixture cleaning"\)/, "Authenticated smoke should search for fixture cleaning");
assert.match(authenticatedBrowserSmoke, /search\.fill\("adhesion"\)/, "Authenticated smoke should search for adhesion");
assert.match(authenticatedBrowserSmoke, /search\.fill\("zzzz-no-result"\)/, "Authenticated smoke should verify no-result query");
assert.match(authenticatedBrowserSmoke, /knowledge_search_used/, "Authenticated smoke should verify Knowledge search analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_filter_used/, "Authenticated smoke should verify Knowledge filter analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_result_opened/, "Authenticated smoke should verify Knowledge open analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_root_cause_copied/, "Authenticated smoke should verify root cause copy analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_corrective_action_copied/, "Authenticated smoke should verify corrective action copy analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_lesson_copied/, "Authenticated smoke should verify lesson copy analytics");
assert.match(authenticatedBrowserSmoke, /verifyEditorKnowledgeReuse/, "Authenticated smoke should cover editor Knowledge Reuse");
assert.match(authenticatedBrowserSmoke, /SMOKE_COMPLETED_REPORT_ID/, "Authenticated smoke should open a seeded completed report in the editor");
assert.match(authenticatedBrowserSmoke, /SMOKE_DRAFT_REPORT_ID/, "Authenticated smoke should open a seeded draft report for Knowledge readiness");
assert.match(authenticatedBrowserSmoke, /smokeStep\("editor knowledge reuse entry"/, "Authenticated smoke should verify the editor Knowledge Reuse entry");
assert.match(authenticatedBrowserSmoke, /smokeStep\("editor knowledge reuse panel"/, "Authenticated smoke should verify the editor Knowledge Reuse panel opens");
assert.match(authenticatedBrowserSmoke, /smokeStep\("editor knowledge reuse search coating"/, "Authenticated smoke should search coating inside editor reuse");
assert.match(authenticatedBrowserSmoke, /knowledge_reuse_panel_opened/, "Authenticated smoke should verify editor reuse panel analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_reuse_search_used/, "Authenticated smoke should verify editor reuse search analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_reuse_result_opened/, "Authenticated smoke should verify editor reuse result open analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_reuse_root_cause_copied/, "Authenticated smoke should verify editor reuse root cause copy analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_reuse_corrective_action_copied/, "Authenticated smoke should verify editor reuse corrective action copy analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_reuse_lesson_copied/, "Authenticated smoke should verify editor reuse lessons learned copy analytics");
assert.match(authenticatedBrowserSmoke, /waitForEvent\("page"\)/, "Authenticated smoke should verify editor reuse opens reports in a new tab");
assert.match(authenticatedBrowserSmoke, /Editor reuse Open report should preserve the current editor tab/, "Authenticated smoke should protect current editor context");
assert.match(authenticatedBrowserSmoke, /verifyAiQualityCheck/, "Authenticated smoke should cover AI Quality Check Knowledge Context fallback");
assert.match(authenticatedBrowserSmoke, /smokeStep\("ai quality check knowledge context unavailable fallback"/, "Authenticated smoke should name the AI Quality Check context fallback step");
assert.match(authenticatedBrowserSmoke, /AI Quality Check is temporarily unavailable/, "Authenticated smoke should verify safe no-real-key AI fallback");
assert.match(authenticatedBrowserSmoke, /Knowledge context used: \\d\+ similar reports|No reusable knowledge context found yet/, "Authenticated smoke should verify AI Quality Check context count or empty state");
assert.match(authenticatedBrowserSmoke, /ai_quality_check_knowledge_context_used/, "Authenticated smoke should accept AI Quality Check used-context analytics");
assert.match(authenticatedBrowserSmoke, /ai_quality_check_knowledge_context_empty/, "Authenticated smoke should accept AI Quality Check empty-context analytics");
assert.match(authenticatedBrowserSmoke, /contextCount/, "Authenticated smoke should permit safe contextCount analytics metadata");
assert.match(authenticatedBrowserSmoke, /hasContext/, "Authenticated smoke should permit safe hasContext analytics metadata");
assert.match(authenticatedBrowserSmoke, /dashboard_feature_entry_clicked/, "Authenticated smoke should verify Dashboard entry analytics");
assert.match(authenticatedBrowserSmoke, /app_navigation_clicked/, "Authenticated smoke should verify app navigation analytics");
assert.match(authenticatedBrowserSmoke, /verifyKnowledgeReadiness/, "Authenticated smoke should cover Knowledge readiness");
assert.match(authenticatedBrowserSmoke, /smokeStep\("knowledge readiness panel"/, "Authenticated smoke should verify the Knowledge readiness panel");
assert.match(authenticatedBrowserSmoke, /smokeStep\("knowledge readiness workflow warning"/, "Authenticated smoke should verify weak-readiness workflow warnings");
assert.match(authenticatedBrowserSmoke, /knowledge_readiness_viewed/, "Authenticated smoke should verify Knowledge readiness view analytics");
assert.match(authenticatedBrowserSmoke, /knowledge_readiness_warning_shown/, "Authenticated smoke should verify Knowledge readiness warning analytics");
assert.match(authenticatedBrowserSmoke, /hasRootCause/, "Authenticated smoke should allow only safe readiness boolean metadata");
assert.match(authenticatedBrowserSmoke, /hasCorrectiveAction/, "Authenticated smoke should allow only safe readiness boolean metadata");
assert.match(authenticatedBrowserSmoke, /hasValidation/, "Authenticated smoke should allow only safe readiness boolean metadata");
assert.match(authenticatedBrowserSmoke, /hasPrevention/, "Authenticated smoke should allow only safe readiness boolean metadata");
assert.match(authenticatedBrowserSmoke, /hasLessonsLearned/, "Authenticated smoke should allow only safe readiness boolean metadata");
assert.match(authenticatedBrowserSmoke, /Could not copy\. Select and copy manually\./, "Authenticated smoke should verify copy failure state");
assert.doesNotMatch(authenticatedBrowserSmoke, /writeText: \(\) => Promise\.reject/, "Clipboard failure stub should avoid transpiled browser-context helper references");
assert.match(authenticatedBrowserSmoke, /assertNoHorizontalOverflow/, "Authenticated smoke should verify mobile and desktop overflow safety");
assert.match(authenticatedBrowserSmoke, /forbiddenKeys/, "Authenticated smoke should reject sensitive analytics metadata keys");
assert.match(authenticatedBrowserSmoke, /forbiddenTerms/, "Authenticated smoke should reject sensitive analytics metadata values");
assert.doesNotMatch(authenticatedBrowserSmoke, /dotenv\/config/, "Authenticated browser smoke must not load local .env implicitly");
for (const forbiddenArtifactTerm of [
  "SmokeTest#2026!",
  "Customer found coating peel-off on brake bracket batch KB-001.",
  "Brake bracket",
  "KB Test Customer",
  "KB-001",
  "Fixture cleaning check was skipped before line change.",
  "Add mandatory fixture cleaning sign-off before production restart.",
  "Line-change controls must include fixture cleaning verification.",
  "zzzz-no-result",
]) {
  assert.match(authenticatedBrowserSmoke, new RegExp(forbiddenArtifactTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Authenticated browser smoke should redact fixture artifact term: ${forbiddenArtifactTerm}`);
}

const authenticatedSmokeDocs = read("docs/AUTHENTICATED_SMOKE_TESTING.md");
assert.match(authenticatedSmokeDocs, /workflow_dispatch/, "Authenticated smoke docs should document manual workflow trigger");
assert.match(authenticatedSmokeDocs, /NEON_API_KEY/, "Authenticated smoke docs should document required Neon secret");
assert.match(authenticatedSmokeDocs, /NEON_PROJECT_ID/, "Authenticated smoke docs should document Neon project var");
assert.match(authenticatedSmokeDocs, /NEON_PARENT_BRANCH_ID/, "Authenticated smoke docs should document Neon parent branch var");
assert.match(authenticatedSmokeDocs, /NEON_DATABASE_NAME/, "Authenticated smoke docs should document Neon database var");
assert.match(authenticatedSmokeDocs, /SMOKE_DB=true/, "Authenticated smoke docs should document smoke DB guard");
assert.match(authenticatedSmokeDocs, /temporary Neon branch/i, "Authenticated smoke docs should document isolated temporary branch use");
assert.match(authenticatedSmokeDocs, /drop/i, "Authenticated smoke docs should document cloned schema reset");
assert.match(authenticatedSmokeDocs, /deleted in an `if: always\(\)`/, "Authenticated smoke docs should document cleanup guarantee");
assert.match(authenticatedSmokeDocs, /Production data must not be created/, "Authenticated smoke docs should prohibit production data writes");
assert.match(authenticatedSmokeDocs, /does not include the full query/, "Authenticated smoke docs should document analytics sensitivity checks");
assert.match(authenticatedSmokeDocs, /Do not use the local `\.env`/, "Authenticated smoke docs should forbid .env fallback");
assert.match(authenticatedSmokeDocs, /Runtime-generated secrets must be masked/, "Authenticated smoke docs should require masking runtime-generated secrets before GitHub env writes");
assert.match(authenticatedSmokeDocs, /Failure Diagnostics/, "Authenticated smoke docs should document failure diagnostics");
assert.match(authenticatedSmokeDocs, /failedStep/, "Authenticated smoke docs should document failed-step artifacts");
assert.match(authenticatedSmokeDocs, /must not include passwords, tokens, cookies, full database URLs, report text/, "Authenticated smoke docs should document artifact redaction boundaries");
assert.match(authenticatedSmokeDocs, /report Knowledge readiness/, "Authenticated smoke docs should document Knowledge readiness coverage");
assert.match(authenticatedSmokeDocs, /Draft report with weak Knowledge readiness fields/, "Authenticated smoke docs should document the readiness fixture");
assert.match(authenticatedSmokeDocs, /Weak readiness workflow transitions/, "Authenticated smoke docs should document warning analytics coverage");
assert.match(authenticatedSmokeDocs, /AI Quality Check Knowledge Context fallback/, "Authenticated smoke docs should document AI Quality Check Knowledge Context coverage");
assert.match(authenticatedSmokeDocs, /must not require or print a real AI provider key/, "Authenticated smoke docs should avoid real AI provider requirements");
assert.match(authenticatedSmokeDocs, /Knowledge context used: N similar reports/, "Authenticated smoke docs should document the AI context count state");

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
assert.match(dashboardPage, /What to do next/, "Dashboard should show a first-screen feature discovery prompt");
assert.match(dashboardPage, /Turn each completed 8D into reusable quality knowledge/, "Dashboard should explain the Knowledge Base value");
assert.match(dashboardPage, /Create reports/, "Dashboard should orient users to report creation");
assert.match(dashboardPage, /Complete and close/, "Dashboard should orient users to completing reports");
assert.match(dashboardPage, /Reuse knowledge/, "Dashboard should orient users to Knowledge Base reuse");
assert.match(dashboardPage, /href="\/knowledge"/, "Dashboard should expose a visible Knowledge Base link");
assert.match(dashboardPage, /dashboard_feature_entry_clicked/, "Dashboard feature entries should use safe analytics");
assert.match(dashboardPage, /trackEvent\("dashboard_feature_entry_clicked", \{ entry, location, plan \}\)/, "Dashboard feature analytics metadata should stay enum-like and plan-only");
assert.match(dashboardPage, /Total accessible reports/, "Dashboard total report metric should explain what it counts");
assert.match(dashboardPage, /In workflow/, "Dashboard active-workflow card title should match activeWorkflow semantics");
assert.match(dashboardPage, /Reports still moving through review, approval, submission, or closure/, "Dashboard active-workflow card should explain that it counts reports still in workflow");
assert.match(dashboardPage, /Not submitted or closed/, "Dashboard in-workflow metric should explain what it counts");
assert.match(dashboardPage, /Eligible knowledge assets/, "Dashboard Knowledge Base metric should explain what it counts");
assert.match(dashboardPage, /Excludes closed reports/, "Dashboard approved/submitted metric should explain its closed-report boundary");
assert.doesNotMatch(dashboardPage, /<CheckCircle2[\s\S]{0,260}Complete and close/, "Dashboard activeWorkflow metric card must not be titled as if the count is completed reports");
assert.match(dashboardPage, /removeTeamMember/, "Dashboard Team workspace should let Owners remove members");
assert.match(dashboardPage, /method: "DELETE"/, "Dashboard member removal should call the Team DELETE API");
assert.match(dashboardPage, /Remove \$\{member\.name \|\| member\.email\}/, "Dashboard member removal should expose an accessible remove label");
assert.match(dashboardPage, /Team activity/, "Dashboard Team workspace should show recent Team activity");
assert.match(dashboardPage, /activity\.message/, "Dashboard Team activity should render human-readable audit messages");

const appLayout = read("src/app/(app)/layout.tsx");
assert.match(appLayout, /Pro · Personal/, "App header should keep Pro positioned as personal use");
assert.match(appLayout, /label: "Dashboard"/, "App header primary navigation should label the workspace home as Dashboard");
assert.match(appLayout, /Knowledge Base/, "App header menu should expose Knowledge Base");
assert.match(appLayout, /Primary app navigation/, "App header should expose primary navigation outside the avatar menu");
assert.match(appLayout, /href="\/dashboard"[\s\S]*navItem: "app_logo"/, "Authenticated app logo should route users back to the Dashboard");
assert.match(appLayout, /href: "\/knowledge"/, "App header primary navigation should include Knowledge Base");
assert.match(appLayout, /href: "\/reports\/new"/, "App header primary navigation should include New Report");
assert.match(appLayout, /md:hidden/, "App header should keep app navigation discoverable on mobile");
assert.match(appLayout, /app_navigation_clicked/, "App navigation should use safe analytics");
assert.match(appLayout, /navItem: item\.navItem/, "App navigation analytics should use enum-like nav item metadata");
assert.match(appLayout, /destination: item\.href/, "App navigation analytics should use destination route metadata");
assert.match(appLayout, /location,\s*plan/, "App navigation analytics should include safe location and plan metadata");

const knowledgePage = read("src/components/knowledge/KnowledgeBaseClient.tsx");
assert.match(knowledgePage, /\/api\/knowledge\/search/, "Knowledge page should use the dedicated Knowledge API");
assert.match(knowledgePage, /method: "POST"/, "Knowledge page should call the Knowledge API with POST");
assert.match(knowledgePage, /query: inputQuery\.trim\(\)/, "Knowledge page should send query in the POST body, not the URL");
assert.match(knowledgePage, /Quality Knowledge Base/, "Knowledge page should use the required page title");
assert.match(knowledgePage, /reportTypeFilters/, "Knowledge page should expose report type filters");
assert.match(knowledgePage, /priorityFilters/, "Knowledge page should expose priority filters");
assert.match(knowledgePage, /Complete your first report to build your knowledge base\./, "Knowledge page should include the required empty state");
assert.match(knowledgePage, /Closed and completed 8D reports become searchable knowledge/, "Knowledge page should explain completed report reuse");
assert.match(knowledgePage, /No matching knowledge found\./, "Knowledge page should include the required no-results state");
assert.match(knowledgePage, /Try a product name, symptom, root cause, corrective action, or customer reference\./, "Knowledge page should include the required no-results guidance");
assert.match(knowledgePage, /Create report/, "Knowledge empty state should link to report creation");
assert.match(knowledgePage, /View sample report/, "Knowledge empty state should link to the sample report");
assert.match(knowledgePage, /Problem Summary/, "Knowledge result cards should show the problem summary");
assert.match(knowledgePage, /Validation/, "Knowledge result cards should show validation content");
assert.match(knowledgePage, /Prevention/, "Knowledge result cards should show prevention content");
assert.match(knowledgePage, /Open report/, "Knowledge result cards should open source reports");
assert.match(knowledgePage, /Copied/, "Knowledge copy success should use the required message");
assert.match(knowledgePage, /Could not copy\. Select and copy manually\./, "Knowledge copy failure should use the required message");
assert.match(knowledgePage, /knowledge_search_used/, "Knowledge page should track safe search analytics");
assert.match(knowledgePage, /knowledge_result_opened/, "Knowledge page should track result opens");
assert.match(knowledgePage, /knowledge_root_cause_copied/, "Knowledge page should track root cause reuse");
assert.match(knowledgePage, /knowledge_corrective_action_copied/, "Knowledge page should track corrective action reuse");
assert.match(knowledgePage, /knowledge_lesson_copied/, "Knowledge page should track lessons learned reuse");
assert.doesNotMatch(knowledgePage, /knowledge_[a-z]+_clicked/, "Knowledge page should not use deprecated generic Knowledge clicked events");
assert.match(knowledgePage, /navigator\.clipboard\.writeText/, "Knowledge page should support copying reusable fields");
assert.doesNotMatch(knowledgePage, /\/api\/share\//, "Knowledge page must not rely on public share links");
assert.doesNotMatch(
  knowledgePage,
  /trackEvent\([\s\S]{0,260}(query:|problem:|rootCause:|correctiveAction:|lessonsLearned:|customer:|supplier:|product:|batch:)/,
  "Knowledge analytics metadata must not include raw query or report content fields",
);

const knowledgeReusePanel = read("src/components/knowledge/KnowledgeReusePanel.tsx");
assert.match(knowledgeReusePanel, /export function KnowledgeReusePanel/, "Knowledge Reuse panel should exist as a dedicated component");
assert.match(knowledgeReusePanel, /\/api\/knowledge\/search/, "Knowledge Reuse panel should reuse the existing Knowledge search API");
assert.match(knowledgeReusePanel, /method: "POST"/, "Knowledge Reuse panel should call Knowledge search with POST");
assert.match(knowledgeReusePanel, /query: inputQuery\.trim\(\)/, "Knowledge Reuse panel should send query in the POST body, not the URL");
assert.match(knowledgeReusePanel, /Copy-only reuse/, "Knowledge Reuse panel should explain copy-only behavior");
assert.match(knowledgeReusePanel, /Copy root cause/, "Knowledge Reuse panel should expose root cause copy");
assert.match(knowledgeReusePanel, /Copy corrective action/, "Knowledge Reuse panel should expose corrective action copy");
assert.match(knowledgeReusePanel, /Copy lessons learned/, "Knowledge Reuse panel should expose lessons learned copy");
assert.match(knowledgeReusePanel, /navigator\.clipboard\.writeText/, "Knowledge Reuse panel should copy values to the clipboard");
assert.match(knowledgeReusePanel, /Copied/, "Knowledge Reuse copy success should use the required message");
assert.match(knowledgeReusePanel, /Could not copy\. Select and copy manually\./, "Knowledge Reuse copy failure should use the required message");
assert.match(knowledgeReusePanel, /target="_blank"/, "Knowledge Reuse Open report should preserve editor context by opening a new tab");
assert.match(knowledgeReusePanel, /rel="noreferrer"/, "Knowledge Reuse new-tab links should avoid leaking referrer context");
assert.match(knowledgeReusePanel, /knowledge_reuse_search_used/, "Knowledge Reuse panel should track safe search analytics");
assert.match(knowledgeReusePanel, /knowledge_reuse_result_opened/, "Knowledge Reuse panel should track result opens");
assert.match(knowledgeReusePanel, /knowledge_reuse_root_cause_copied/, "Knowledge Reuse panel should track root cause copies");
assert.match(knowledgeReusePanel, /knowledge_reuse_corrective_action_copied/, "Knowledge Reuse panel should track corrective action copies");
assert.match(knowledgeReusePanel, /knowledge_reuse_lesson_copied/, "Knowledge Reuse panel should track lessons learned copies");
assert.match(knowledgeReusePanel, /source: "editor"/, "Knowledge Reuse analytics should use editor source metadata");
assert.match(knowledgeReusePanel, /queryLength/, "Knowledge Reuse analytics should track query length instead of raw query text");
assert.match(knowledgeReusePanel, /resultCount/, "Knowledge Reuse analytics should track result count");
assert.match(knowledgeReusePanel, /copiedField/, "Knowledge Reuse copy analytics should track the copied field enum");
assert.doesNotMatch(knowledgeReusePanel, /handleFieldChange|saveToServer|report_saved|onApplyDraft|method: "PUT"|\/api\/reports\//, "Knowledge Reuse panel must not write report fields or save reports");
assert.doesNotMatch(knowledgeReusePanel, /trackEvent\([\s\S]{0,280}(query:|problem:|rootCause:|correctiveAction:|lessonsLearned:|customer:|supplier:|product:|batch:)/, "Knowledge Reuse analytics metadata must not include raw query or report content fields");
assert.doesNotMatch(knowledgeReusePanel, /AiReportTools|ai\/|ExportMenu|Checkout|pricing|drizzle|db\/schema|CREATE TABLE|ALTER TABLE/, "Knowledge Reuse panel must not couple to AI, export, payment, or database schema code");
assert.doesNotMatch(knowledgeReusePanel, /reportShares|accessToken|share token/i, "Knowledge Reuse panel must not rely on public share tokens");

const knowledgeReadinessPanel = read("src/components/report/KnowledgeReadinessPanel.tsx");
const reportStepsSource = read("src/lib/report-steps.ts");
assert.match(knowledgeReadinessPanel, /export function KnowledgeReadinessPanel/, "Knowledge readiness should exist as a reusable report component");
assert.match(knowledgeReadinessPanel, /Knowledge readiness/, "Knowledge readiness panel should use the required title");
assert.match(knowledgeReadinessPanel, /item\.label/, "Knowledge readiness panel should render readiness labels from the summary");
assert.match(reportStepsSource, /Root cause captured\?/, "Knowledge readiness summary should provide root-cause readiness");
assert.match(reportStepsSource, /Corrective action captured\?/, "Knowledge readiness summary should provide corrective-action readiness");
assert.match(reportStepsSource, /Validation captured\?/, "Knowledge readiness summary should provide validation readiness");
assert.match(reportStepsSource, /Prevention\/system change captured\?/, "Knowledge readiness summary should provide prevention/system-change readiness");
assert.match(reportStepsSource, /Lessons learned captured\?/, "Knowledge readiness summary should provide lessons-learned readiness");
assert.match(knowledgeReadinessPanel, /Ready/, "Knowledge readiness panel should expose the Ready status");
assert.match(knowledgeReadinessPanel, /Needs detail/, "Knowledge readiness panel should expose the Needs detail status");
assert.match(knowledgeReadinessPanel, /Missing/, "Knowledge readiness panel should expose the Missing status");
assert.match(knowledgeReadinessPanel, /knowledge_readiness_viewed/, "Knowledge readiness panel should track safe view analytics");
assert.match(knowledgeReadinessPanel, /knowledgeReadinessAnalytics/, "Knowledge readiness panel should centralize safe analytics metadata");
for (const safeReadinessKey of [
  "missingCount",
  "hasRootCause",
  "hasCorrectiveAction",
  "hasValidation",
  "hasPrevention",
  "hasLessonsLearned",
  "plan",
]) {
  assert.match(knowledgeReadinessPanel, new RegExp(safeReadinessKey), `Knowledge readiness analytics should include safe key ${safeReadinessKey}`);
}
assert.doesNotMatch(
  knowledgeReadinessPanel,
  /trackEvent\([\s\S]{0,260}(query:|problem:|rootCause:|correctiveAction:|lessonsLearned:|customer:|supplier:|product:|batch:|validationResults:|systemChanges:|processUpdates:)/,
  "Knowledge readiness analytics metadata must not include raw query or report content fields",
);
assert.doesNotMatch(knowledgeReadinessPanel, /handleFieldChange|saveToServer|method: "PUT"|\/api\/reports\//, "Knowledge readiness panel must not save or mutate reports");

const eventsRoute = read("src/app/api/events/route.ts");
assert.match(eventsRoute, /app_navigation_clicked/, "Analytics allowlist should include app navigation clicks");
assert.match(eventsRoute, /dashboard_feature_entry_clicked/, "Analytics allowlist should include dashboard feature-entry clicks");
assert.match(eventsRoute, /ai_quality_check_knowledge_context_used/, "Analytics allowlist should include AI Quality Check used-context event");
assert.match(eventsRoute, /ai_quality_check_knowledge_context_empty/, "Analytics allowlist should include AI Quality Check empty-context event");
assert.match(eventsRoute, /knowledge_search_used/, "Analytics allowlist should include Knowledge search");
assert.match(eventsRoute, /knowledge_result_opened/, "Analytics allowlist should include Knowledge result opens");
assert.match(eventsRoute, /knowledge_root_cause_copied/, "Analytics allowlist should include root cause copy");
assert.match(eventsRoute, /knowledge_corrective_action_copied/, "Analytics allowlist should include corrective action copy");
assert.match(eventsRoute, /knowledge_lesson_copied/, "Analytics allowlist should include lessons learned copy");
assert.match(eventsRoute, /knowledge_reuse_panel_opened/, "Analytics allowlist should include editor Knowledge Reuse panel opens");
assert.match(eventsRoute, /knowledge_reuse_search_used/, "Analytics allowlist should include editor Knowledge Reuse search");
assert.match(eventsRoute, /knowledge_reuse_result_opened/, "Analytics allowlist should include editor Knowledge Reuse result opens");
assert.match(eventsRoute, /knowledge_reuse_root_cause_copied/, "Analytics allowlist should include editor Knowledge Reuse root cause copies");
assert.match(eventsRoute, /knowledge_reuse_corrective_action_copied/, "Analytics allowlist should include editor Knowledge Reuse corrective action copies");
assert.match(eventsRoute, /knowledge_reuse_lesson_copied/, "Analytics allowlist should include editor Knowledge Reuse lessons learned copies");
assert.match(eventsRoute, /knowledge_readiness_viewed/, "Analytics allowlist should include Knowledge readiness views");
assert.match(eventsRoute, /knowledge_readiness_warning_shown/, "Analytics allowlist should include Knowledge readiness warnings");
assert.doesNotMatch(eventsRoute, /knowledge_[a-z]+_clicked/, "Analytics allowlist should not include deprecated generic Knowledge clicked events");

const knowledgeSpec = read("docs/QUALITY_KNOWLEDGE_BASE_SPEC.md");
assert.match(knowledgeSpec, /Every completed 8D report/, "Knowledge spec should state the core asset principle");
assert.match(knowledgeSpec, /v1 does not add AI|V1 does not add AI/, "Knowledge spec should keep AI out of v1");
assert.match(knowledgeSpec, /Vector database|vector database/, "Knowledge spec should document no vector database in v1");
assert.match(knowledgeSpec, /Attachment parsing|attachment parsing/, "Knowledge spec should document no attachment parsing in v1");
assert.match(knowledgeSpec, /Database schema migration|database schema migration/, "Knowledge spec should document no schema migration in v1");
assert.match(knowledgeSpec, /Permission Matrix/, "Knowledge spec should include a permission matrix");
assert.match(knowledgeSpec, /report\.data/, "Knowledge spec should map report.data fields");

const externalRequestSpec = read("docs/EXTERNAL_8D_REQUEST_WORKFLOW_SPEC.md");
assert.match(externalRequestSpec, /External 8D Request turns 8D Reports/, "External request spec should state the product goal");
assert.match(externalRequestSpec, /Customer quality team[\s\S]*Supplier responder[\s\S]*Internal reviewer[\s\S]*Team owner/, "External request spec should define required actors");
assert.match(externalRequestSpec, /MVP Flow[\s\S]*create[\s\S]*invite[\s\S]*secure link[\s\S]*fills assigned sections[\s\S]*reviews[\s\S]*request revision[\s\S]*export[\s\S]*close/i, "External request spec should document the MVP flow");
assert.match(externalRequestSpec, /Permission Matrix/, "External request spec should include a permission matrix");
assert.match(externalRequestSpec, /Token Security Model/, "External request spec should include token security");
assert.match(externalRequestSpec, /dedicated request tokens/, "External request spec should reject generic report share tokens for supplier requests");
assert.match(externalRequestSpec, /Login vs Guest Decision/, "External request spec should define login vs guest behavior");
assert.match(externalRequestSpec, /Ownership Model/, "External request spec should define ownership");
assert.match(externalRequestSpec, /Audit Log Requirements/, "External request spec should include audit log requirements");
assert.match(externalRequestSpec, /Email Notifications/, "External request spec should include email notification requirements");
assert.match(externalRequestSpec, /Data Exposure Rules/, "External request spec should include data exposure rules");
assert.match(externalRequestSpec, /Supplier guest views must not expose[\s\S]*Dashboard[\s\S]*Knowledge Base[\s\S]*team member list[\s\S]*billing/, "External request spec should restrict supplier guest access");
assert.match(externalRequestSpec, /Abuse \/ Spam Risk/, "External request spec should document abuse and spam risks");
assert.match(externalRequestSpec, /Non-Goals/, "External request spec should include non-goals");
assert.match(externalRequestSpec, /No runtime external request feature/, "External request spec should remain docs-only for this PR");
assert.match(externalRequestSpec, /Required Schema Changes For Future PR/, "External request spec should document future schema needs");
assert.match(externalRequestSpec, /external_8d_requests[\s\S]*external_8d_request_tokens/, "External request spec should recommend dedicated future tables");
assert.match(externalRequestSpec, /Smoke Strategy/, "External request spec should include smoke strategy");
assert.match(externalRequestSpec, /revoked\/expired tokens fail safely/, "External request smoke strategy should cover revoked and expired tokens");
assert.doesNotMatch(externalRequestSpec, /supports full QMS|includes SSO|provides SSO/i, "External request spec should not overclaim unsupported product scope");

const reportCompletionKnowledgeSpec = read("docs/REPORT_COMPLETION_KNOWLEDGE_CAPTURE_SPEC.md");
assert.match(reportCompletionKnowledgeSpec, /Completed 8D reports become valuable/, "Report completion knowledge spec should explain the business value");
assert.match(reportCompletionKnowledgeSpec, /guidance only/, "Report completion knowledge spec should keep readiness non-blocking");
assert.match(reportCompletionKnowledgeSpec, /No workflow eligibility changes/, "Report completion knowledge spec should prohibit workflow eligibility changes");
assert.match(reportCompletionKnowledgeSpec, /No database schema changes/, "Report completion knowledge spec should prohibit schema changes");
assert.match(reportCompletionKnowledgeSpec, /Root cause[\s\S]*Corrective action[\s\S]*Validation[\s\S]*Prevention[\s\S]*Lessons learned/, "Report completion knowledge spec should document the five readiness groups");
assert.match(reportCompletionKnowledgeSpec, /knowledge_readiness_viewed/, "Report completion knowledge spec should document readiness view analytics");
assert.match(reportCompletionKnowledgeSpec, /knowledge_readiness_warning_shown/, "Report completion knowledge spec should document readiness warning analytics");
assert.match(reportCompletionKnowledgeSpec, /missingCount[\s\S]*hasRootCause[\s\S]*hasCorrectiveAction[\s\S]*hasValidation[\s\S]*hasPrevention[\s\S]*hasLessonsLearned[\s\S]*plan/, "Report completion knowledge analytics should remain safe and bounded");
const dbSchema = read("src/lib/db/schema.ts");
assert.doesNotMatch(dbSchema, /knowledgeReadiness|readinessStatus|knowledge_readiness/, "Report completion knowledge capture v1 must not add database schema fields or tables");

const discoverabilityAudit = read("docs/AUTHENTICATED_APP_DISCOVERABILITY_AUDIT.md");
assert.match(discoverabilityAudit, /Stage Full Score Standard/, "Discoverability audit should define full-score criteria");
assert.match(
  discoverabilityAudit,
  /\| Feature \| User value \| Target user \| Current location before PR9 \| Location after PR9 \| Current discoverability score \| Target discoverability score \| Status \| Should be primary \/ secondary \/ contextual \/ advanced \| Current analytics \| Problem \| Recommendation \| This PR action \| Future action \|/,
  "Discoverability audit should use the required 12-feature audit table columns",
);
for (const feature of [
  "Dashboard / My Reports",
  "New Report",
  "Knowledge Base",
  "Report editor D0-D8",
  "Attachments / Evidence",
  "Share link",
  "Export PDF / Word / Excel",
  "Activity Log / revision history",
  "AI Quality Check",
  "Team workspace / roles / approval",
  "Pricing / upgrade / single export",
  "Search / historical reuse",
]) {
  assert.match(discoverabilityAudit, new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Discoverability audit should cover ${feature}`);
}
const retiredDiscoverabilityOverclaims = new RegExp(
  [["Should Be", "Full Score But Is Not Yet"].join(" "), ["None after", "this PR"].join(" ")]
    .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
);
assert.doesNotMatch(discoverabilityAudit, retiredDiscoverabilityOverclaims, "Discoverability audit should not overclaim that all future/full-score gaps are gone");
assert.match(discoverabilityAudit, /Remaining Non-Primary Items/, "Discoverability audit should document acceptable non-primary items");
assert.match(discoverabilityAudit, /Personalized onboarding checklist/, "Discoverability audit should separate onboarding checklist work from PR #9");
assert.match(discoverabilityAudit, /Future Items/, "Discoverability audit should list future-only discoverability ideas");
assert.match(discoverabilityAudit, /app_navigation_clicked/, "Discoverability audit should document app navigation analytics");
assert.match(discoverabilityAudit, /dashboard_feature_entry_clicked/, "Discoverability audit should document dashboard feature-entry analytics");
assert.match(discoverabilityAudit, /Do not send/, "Discoverability audit should document sensitive analytics exclusions");
assert.match(discoverabilityAudit, /No public marketing, payment, export, AI, auth, database schema, or Knowledge Base search logic changes/, "Discoverability audit should preserve task scope boundaries");

const marketingWorkflow = read("docs/MARKETING_WORKFLOW.md");
assert.match(marketingWorkflow, /Knowledge Base Metrics/, "Marketing workflow should include Knowledge Base metrics");
assert.match(marketingWorkflow, /knowledge_result_opened/, "Marketing workflow should track Knowledge result open rate");
assert.match(marketingWorkflow, /knowledge_root_cause_copied/, "Marketing workflow should track root cause reuse");
assert.match(marketingWorkflow, /repeat knowledge users/i, "Marketing workflow should track repeat Knowledge Base users");

const offsiteGeoDistributionPack = read("docs/OFFSITE_GEO_DISTRIBUTION_PACK.md");
assert.match(offsiteGeoDistributionPack, /Offsite GEO Distribution Pack/, "Offsite GEO distribution pack should exist");
for (const platformSection of ["LinkedIn", "Medium", "Quora", "Reddit"]) {
  assert.match(offsiteGeoDistributionPack, new RegExp(`## ${platformSection}`), `Offsite pack should include ${platformSection}`);
}
function sectionBetween(source: string, start: string, end: string) {
  return source.split(start)[1]?.split(end)[0] || "";
}
const linkedInSection = sectionBetween(offsiteGeoDistributionPack, "## LinkedIn", "## Medium");
const mediumSection = sectionBetween(offsiteGeoDistributionPack, "## Medium", "## Quora");
const quoraSection = sectionBetween(offsiteGeoDistributionPack, "## Quora", "## Reddit");
const redditSection = sectionBetween(offsiteGeoDistributionPack, "## Reddit", "## Rules");
assert.ok((linkedInSection.match(/^\| \d+ \|/gm) || []).length >= 10, "Offsite pack should include at least 10 LinkedIn posts");
assert.ok((mediumSection.match(/^\| \d+ \|/gm) || []).length >= 5, "Offsite pack should include at least 5 Medium outlines");
assert.ok((quoraSection.match(/^\| \d+ \|/gm) || []).length >= 20, "Offsite pack should include at least 20 Quora answer drafts");
assert.ok((redditSection.match(/^\| \d+ \|/gm) || []).length >= 10, "Offsite pack should include at least 10 Reddit-safe discussion prompts");
for (const linkedInColumn of ["Target role", "Hook", "Short story/problem", "Practical takeaway", "Soft CTA", "Link suggestion"]) {
  assert.match(linkedInSection, new RegExp(linkedInColumn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `LinkedIn pack should include column: ${linkedInColumn}`);
}
for (const requiredOffsiteRule of [
  "Do not auto-post",
  "Do not spam",
  "Do not fabricate personal experience",
  "No sales pitch",
  "one natural link",
  "disclose product context honestly",
  "No automated posting",
  "No bulk spam",
  "No fake user stories",
  "No fake statistics",
  "No fake customer logos",
  "No \"best in the world\" claims",
  "No guaranteed customer acceptance claims",
  "No hidden product affiliation",
  "No repeated copy-paste answers",
  "No over-linking",
  "Track manually",
]) {
  assert.match(offsiteGeoDistributionPack, new RegExp(requiredOffsiteRule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Offsite pack should include rule: ${requiredOffsiteRule}`);
}
for (const forbiddenOffsiteTrackingData of [
  "customer names",
  "product names",
  "problem descriptions",
  "root cause text",
  "corrective action text",
  "lessons learned",
  "uploaded file content",
  "AI prompts",
  "raw AI output",
]) {
  assert.match(offsiteGeoDistributionPack, new RegExp(forbiddenOffsiteTrackingData.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Offsite pack should forbid private tracking data: ${forbiddenOffsiteTrackingData}`);
}

const productOperatingMetrics = read("docs/PRODUCT_OPERATING_METRICS.md");
assert.match(productOperatingMetrics, /Product Operating Metrics/, "Product operating metrics doc should exist");
assert.match(productOperatingMetrics, /does not add runtime tracking/, "Product metrics should not add runtime tracking");
assert.match(productOperatingMetrics, /database-derived metrics/i, "Product metrics should prefer database-derived metrics where event tracking would be sensitive");
assert.match(productOperatingMetrics, /Core Funnel/, "Product metrics should define the core funnel");
for (const funnelStep of [
  "Visitor -> Signup",
  "Signup -> First report created",
  "First report created -> D4/D5 filled",
  "Report completed -> Knowledge asset created",
  "Knowledge asset -> Knowledge search",
  "Knowledge search -> Copy root cause/action/lesson",
  "Editor reuse opened -> Copy",
  "AI Quality Check run",
  "Export / share",
  "Team upgrade / service request",
]) {
  assert.match(productOperatingMetrics, new RegExp(funnelStep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Product metrics should cover funnel step: ${funnelStep}`);
}
for (const requiredColumn of [
  "Event name / source",
  "Source page or component",
  "Why it matters",
  "Safe metadata",
  "Do not collect",
  "Target interpretation",
]) {
  assert.match(productOperatingMetrics, new RegExp(requiredColumn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Product metrics should include column: ${requiredColumn}`);
}
for (const requiredEvent of [
  "signup_success",
  "report_created",
  "report_saved",
  "knowledge_search_used",
  "knowledge_root_cause_copied",
  "knowledge_corrective_action_copied",
  "knowledge_lesson_copied",
  "knowledge_reuse_panel_opened",
  "knowledge_reuse_root_cause_copied",
  "knowledge_reuse_corrective_action_copied",
  "knowledge_reuse_lesson_copied",
  "ai_report_review_clicked",
  "export_clicked",
  "share_link_created",
  "upgrade_clicked",
  "checkout_started",
  "checkout_completed",
]) {
  assert.match(productOperatingMetrics, new RegExp(requiredEvent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Product metrics should document event: ${requiredEvent}`);
}
for (const forbiddenMetricValue of [
  "full search query",
  "problem description",
  "root cause text",
  "corrective action text",
  "lessons learned text",
  "customer name",
  "supplier name",
  "product name",
  "batch or lot number",
  "attachment content",
  "share token",
  "email address",
  "payment details",
  "AI prompt",
  "AI raw response",
]) {
  assert.match(productOperatingMetrics, new RegExp(forbiddenMetricValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Product metrics should forbid collecting: ${forbiddenMetricValue}`);
}
for (const safeMetricField of [
  "source",
  "plan",
  "reportType",
  "stepId",
  "filledFieldCount",
  "queryLength",
  "resultCount",
  "copiedField",
  "hasContext",
  "contextCount",
  "format",
  "permissionLevel",
  "billingInterval",
  "requestType",
]) {
  assert.match(productOperatingMetrics, new RegExp(`\`${safeMetricField}\``), `Product metrics should include safe metadata field: ${safeMetricField}`);
}
assert.match(productOperatingMetrics, /Knowledge asset creation should be a derived metric/, "Knowledge asset creation should be derived instead of tracked from raw report content");
assert.match(productOperatingMetrics, /D4\/D5 field completion should be computed from database state/, "D4/D5 completion should be computed without raw text analytics");
assert.doesNotMatch(productOperatingMetrics, /full QMS|\bSSO\b|automatic AI approval/i, "Product metrics should not introduce unsupported product claims");

const requiredRevenueGeoSlugs = [
  "how-to-write-8d-report-customer-complaint",
  "supplier-corrective-action-request-template",
  "8d-vs-scar",
  "excel-8d-template-vs-8d-software",
  "custom-8d-template-setup-guide",
  "ai-8d-report-checker",
  "8d-root-cause-d4-guide",
  "8d-corrective-action-d5-guide",
  "8d-validation-d6-guide",
  "8d-lessons-learned-d8-guide",
];
assert.equal(revenueGeoResources.length, 10, "Revenue GEO content batch should stay capped at 10 pages");
assert.deepEqual(
  revenueGeoResources.map((resource) => resource.slug).sort(),
  [...requiredRevenueGeoSlugs].sort(),
  "Revenue GEO content batch should include the approved first-batch resource slugs",
);
for (const resource of revenueGeoResources) {
  assert.ok(resource.metaTitle.length > 20, `${resource.slug} should have a unique meta title`);
  assert.ok(resource.metaDescription.length > 80, `${resource.slug} should have a useful meta description`);
  assert.ok(resource.answer.length > 120, `${resource.slug} should have answer-first copy`);
  assert.ok(resource.checklist.length >= 5, `${resource.slug} should include a practical checklist`);
  assert.ok(resource.mistakes.length >= 4, `${resource.slug} should include common mistakes`);
  assert.ok(resource.table.rows.length >= 5, `${resource.slug} should include an example/comparison table`);
  assert.ok(resource.sections.some((section) => /Template Setup|Assisted First 8D/.test(section.body)), `${resource.slug} should explain when to use service CTAs`);
  assert.ok(resource.relatedLinks.length >= 3, `${resource.slug} should include internal links`);
  assert.ok(resource.faq.length >= 2, `${resource.slug} should include visible FAQ content`);
}
const revenueGeoContent = read("src/content/revenue-geo-resources.ts");
for (const forbiddenRevenueGeoClaim of [
  "guaranteed customer acceptance",
  "guaranteed acceptance",
  "certified approval",
  "best in the world",
]) {
  assert.doesNotMatch(revenueGeoContent, new RegExp(forbiddenRevenueGeoClaim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Revenue GEO content should not claim: ${forbiddenRevenueGeoClaim}`);
}
assert.match(revenueGeoContent, /not a full QMS/i, "Revenue GEO content should preserve the not-a-full-QMS boundary");
for (const safeRevenueGeoEvent of [
  "marketing_cta_clicked",
  "pricing_service_cta_clicked",
  "demo_report_downloaded",
  "knowledge_search_used",
]) {
  assert.match(revenueGeoContent, new RegExp(safeRevenueGeoEvent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Revenue GEO resources should use safe event: ${safeRevenueGeoEvent}`);
}
const revenueGeoRoute = read("src/app/(marketing)/resources/[slug]/page.tsx");
assert.match(revenueGeoRoute, /dynamicParams = false/, "Revenue GEO resource route should statically limit generated slugs");
assert.match(revenueGeoRoute, /generateStaticParams/, "Revenue GEO resource route should generate static params");
assert.match(revenueGeoRoute, /generateMetadata/, "Revenue GEO resource route should generate unique metadata");
assert.match(revenueGeoRoute, /alternates: \{ canonical: url \}/, "Revenue GEO resource route should set canonical URLs");
assert.match(revenueGeoRoute, /FAQPage/, "Revenue GEO resource route should include FAQPage JSON-LD");
assert.match(revenueGeoRoute, /resource\.faq\.map/, "Revenue GEO FAQ schema should be generated from visible FAQ content");
assert.match(revenueGeoRoute, /Article/, "Revenue GEO resource route should include Article JSON-LD");
assert.match(revenueGeoRoute, /Practical checklist/, "Revenue GEO resource route should render checklist content");
assert.match(revenueGeoRoute, /Common mistakes/, "Revenue GEO resource route should render common mistakes");
assert.match(revenueGeoRoute, /resource\.table\.rows/, "Revenue GEO resource route should render the example/comparison table");
assert.match(revenueGeoRoute, /PrimaryCTA/, "Revenue GEO resource route should include existing tracked CTA components");
assert.match(revenueGeoRoute, /notFound\(\)/, "Revenue GEO resource route should 404 unknown slugs");

const resourcesPage = read("src/app/(marketing)/resources/page.tsx");
assert.match(resourcesPage, /revenueGeoResources/, "Resources index should include revenue GEO resources");
assert.match(resourcesPage, /categoryKey: "revenue-geo"/, "Resources index should categorize revenue GEO resources");
const resourcesExplorer = read("src/components/marketing/ResourcesExplorer.tsx");
assert.match(resourcesExplorer, /Revenue Guides/, "Resources explorer should expose a Revenue Guides filter");
const sitemapRoute = read("src/app/sitemap.ts");
assert.match(sitemapRoute, /revenueGeoResources/, "Sitemap should include revenue GEO resource pages");
assert.match(sitemapRoute, /\/resources\/\$\{page\.slug\}/, "Sitemap should generate canonical resource URLs");
const seoCheck = read("scripts/check-seo-urls.ts");
assert.match(seoCheck, /revenueGeoResources/, "SEO URL check should know about revenue GEO resources");
assert.equal(packageJson.scripts?.["check:seo"], "tsx scripts/check-seo-urls.ts", "Package scripts should expose SEO URL checks");
const revenueGeoProductionSmoke = read("scripts/production-smoke.test.ts");
assert.match(revenueGeoProductionSmoke, /revenueResourcePages/, "Production smoke should cover revenue GEO resource pages");
assert.match(revenueGeoProductionSmoke, /Practical checklist[\s\S]*Common mistakes[\s\S]*FAQ/, "Production smoke should verify resource page quality markers");

const geoContentProductionPlan = read("docs/GEO_CONTENT_PRODUCTION_PLAN.md");
assert.match(geoContentProductionPlan, /GEO Content Production Plan/, "GEO content production plan should exist");
assert.match(geoContentProductionPlan, /30-Day Content Calendar/, "GEO content production plan should include a 30-day calendar");
const geoContentRows = geoContentProductionPlan.match(/^\| \d+ \| Week [1-4]:/gm) || [];
assert.ok(geoContentRows.length >= 30, `GEO content production plan should include at least 30 article rows, found ${geoContentRows.length}`);
for (const requiredWeek of [
  "Week 1: Revenue pages / high-intent service content",
  "Week 2: Core 8D instructional content",
  "Week 3: Industry examples",
  "Week 4: Comparison / AI / Knowledge Base",
]) {
  assert.match(geoContentProductionPlan, new RegExp(requiredWeek.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO content plan should include ${requiredWeek}`);
}
for (const requiredContentColumn of [
  "Target query",
  "Title",
  "Search intent",
  "Answer-first outline",
  "Proof elements",
  "Internal links",
  "CTA",
  "Offsite repurposing target",
  "Measurement event",
]) {
  assert.match(geoContentProductionPlan, new RegExp(requiredContentColumn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO content plan should include column: ${requiredContentColumn}`);
}
for (const requiredTopic of [
  "custom 8D template setup",
  "assisted first 8D report",
  "team 8D launch",
  "Excel 8D template vs online 8D software",
  "supplier corrective action request template",
  "D4 root cause",
  "D5 corrective action",
  "D6 validation",
  "D7 prevention and D8 lessons learned",
  "automotive 8D report example",
  "electronics 8D report example",
  "semiconductor 8D report example",
  "medical device corrective action report example",
  "injection molding defect 8D example",
  "AI 8D report checker",
  "8D knowledge base software",
  "reuse past root causes in 8D reports",
  "8D vs SCAR",
]) {
  assert.match(geoContentProductionPlan, new RegExp(requiredTopic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `GEO content plan should include topic: ${requiredTopic}`);
}
for (const writingRule of [
  "first 80 words",
  "practical checklist",
  "manufacturing",
  "SQE",
  "example table",
  "Common mistakes",
  "When to use Template Setup / Assisted First 8D",
  "demo/sample",
  "fake statistics",
  "generic AI fluff",
  "keyword stuffing",
]) {
  assert.match(geoContentProductionPlan, new RegExp(writingRule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `GEO writing rules should cover: ${writingRule}`);
}
for (const platformSection of [
  "LinkedIn Post Version",
  "Medium Article Version",
  "Quora Answer Version",
  "Reddit-Safe Discussion Version",
]) {
  assert.match(geoContentProductionPlan, new RegExp(platformSection.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO content plan should include platform section: ${platformSection}`);
}
for (const antiSpamRule of [
  "Do not auto-post",
  "Do not spam",
  "Do not fabricate personal experience",
  "Do not over-link",
  "No sales pitch",
]) {
  assert.match(geoContentProductionPlan, new RegExp(antiSpamRule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `GEO repurposing rules should include: ${antiSpamRule}`);
}
for (const safeContentEvent of [
  "seo_page_view",
  "marketing_cta_clicked",
  "pricing_service_cta_clicked",
  "demo_report_downloaded",
  "knowledge_search_used",
  "ai_report_review_clicked",
]) {
  assert.match(geoContentProductionPlan, new RegExp(safeContentEvent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO content plan should include safe event: ${safeContentEvent}`);
}
for (const forbiddenContentAnalyticsData of [
  "full user queries",
  "customer names",
  "supplier names",
  "product names",
  "report text",
  "root cause text",
  "corrective action text",
  "lessons learned",
  "batch or lot numbers",
  "uploaded file content",
  "AI prompts",
  "raw AI output",
]) {
  assert.match(geoContentProductionPlan, new RegExp(forbiddenContentAnalyticsData.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `GEO content plan should forbid analytics collection of: ${forbiddenContentAnalyticsData}`);
}
assert.match(geoContentProductionPlan, /guaranteed acceptance claims/i, "GEO content plan should explicitly prohibit guaranteed acceptance claims");
assert.match(geoContentProductionPlan, /certification claims/i, "GEO content plan should explicitly prohibit unsupported certification claims");

const geoRevenueQueryMap = read("docs/GEO_REVENUE_QUERY_MAP.md");
assert.match(geoRevenueQueryMap, /GEO Revenue Query Map/, "GEO revenue query map should exist");
assert.match(geoRevenueQueryMap, /does not invent search volume/, "GEO revenue query map should not invent search volume");
assert.match(geoRevenueQueryMap, /hypothesis/i, "GEO revenue query map should mark unevidenced query assumptions as hypotheses");
assert.match(geoRevenueQueryMap, /Do not use it to publish[\s\S]*low-quality SEO pages/i, "GEO revenue query map should prohibit thin SEO content");
for (const geoCategory of [
  "Core 8D Report Intent",
  "SCAR / Supplier Corrective Action",
  "Customer Complaint Response",
  "Industry Examples",
  "Role-Based Intent",
  "Excel Replacement Intent",
  "AI / Knowledge Reuse Intent",
  "Service / Paid Intent",
]) {
  assert.match(geoRevenueQueryMap, new RegExp(geoCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO revenue query map should cover category: ${geoCategory}`);
}
const geoQueryRows = geoRevenueQueryMap.match(/^\| [A-H]\d{2} \|/gm) || [];
assert.ok(geoQueryRows.length >= 150, `GEO revenue query map should include at least 150 query rows, found ${geoQueryRows.length}`);
for (const categoryPrefix of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
  const categoryRows = geoQueryRows.filter((row) => row.startsWith(`| ${categoryPrefix}`));
  assert.ok(categoryRows.length >= 15, `GEO revenue query map should include broad ${categoryPrefix} category coverage, found ${categoryRows.length}`);
}
for (const requiredGeoColumn of [
  "Query",
  "Intent",
  "Target page type",
  "CTA",
  "Priority",
  "Why it matters",
  "Content angle",
  "Internal link target",
  "Safe metadata / tracking event",
]) {
  assert.match(geoRevenueQueryMap, new RegExp(requiredGeoColumn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO revenue query map should include column: ${requiredGeoColumn}`);
}
for (const representativeGeoQuery of [
  "how to write an 8D report for customer complaint",
  "supplier corrective action request template",
  "how to respond to customer complaint with 8D",
  "automotive 8D report example",
  "SQE 8D report workflow",
  "Excel 8D template vs 8D software",
  "AI 8D report checker",
  "custom 8D report template setup",
]) {
  assert.match(geoRevenueQueryMap, new RegExp(representativeGeoQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `GEO revenue query map should include representative query: ${representativeGeoQuery}`);
}
for (const geoCta of ["Template Setup", "Team Launch", "Assisted First 8D", "Signup", "Demo Download"]) {
  assert.match(geoRevenueQueryMap, new RegExp(geoCta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO revenue query map should include CTA: ${geoCta}`);
}
for (const safeGeoEvent of [
  "seo_page_view",
  "marketing_cta_clicked",
  "pricing_service_cta_clicked",
  "demo_report_downloaded",
  "knowledge_search_used",
  "ai_report_review_clicked",
]) {
  assert.match(geoRevenueQueryMap, new RegExp(safeGeoEvent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `GEO revenue query map should include safe event: ${safeGeoEvent}`);
}
for (const forbiddenGeoAnalyticsData of [
  "full queries",
  "customer names",
  "product names",
  "report text",
  "root cause text",
  "corrective action text",
  "lessons learned",
  "batch numbers",
  "AI prompts",
  "uploaded file content",
]) {
  assert.match(geoRevenueQueryMap, new RegExp(forbiddenGeoAnalyticsData.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `GEO revenue query map should forbid analytics collection of: ${forbiddenGeoAnalyticsData}`);
}

const revenueEvidenceOperatingSystem = read("docs/REVENUE_EVIDENCE_OPERATING_SYSTEM.md");
assert.match(revenueEvidenceOperatingSystem, /Revenue Evidence Operating System/, "Revenue evidence operating system doc should exist");
assert.match(revenueEvidenceOperatingSystem, /does not add runtime tracking/, "Revenue operating system should stay docs-only");
for (const dailySignal of [
  "Visits",
  "Demo report downloads",
  "Template Setup CTA clicks",
  "Template Setup lead submits",
  "Team Launch CTA clicks",
  "Assisted First 8D / SCAR CTA clicks",
  "Contact form submits",
  "Signup",
  "First report created",
  "Export attempted",
  "Knowledge search",
  "Editor reuse opened",
  "AI Quality Check intent",
]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(dailySignal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Revenue operating system should include daily signal: ${dailySignal}`);
}
for (const weeklyPattern of [
  "Demo downloads but no leads",
  "CTA clicks but no lead submits",
  "Leads but no replies",
  "Signup but no report created",
  "Report created but no export",
  "Knowledge reuse but no AI check",
  "AI check but no export/share",
]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(weeklyPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Revenue operating system should include weekly decision rule: ${weeklyPattern}`);
}
for (const leadType of [
  "Template Setup",
  "Team Launch",
  "Assisted First 8D / SCAR",
]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(`### ${leadType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `Revenue operating system should include lead follow-up playbook for ${leadType}`);
}
for (const targetWindow of ["Week 1", "Month 1", "Month 3"]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(`### ${targetWindow}`), `Revenue operating system should define targets for ${targetWindow}`);
}
for (const requiredTarget of [
  "10+ demo downloads",
  "3+ service CTA clicks",
  "1+ lead",
  "50+ demo downloads",
  "10+ service CTA clicks",
  "3+ leads",
  "1 paid assisted/service conversation",
  "2-3 paid service deals",
  "First Team Launch",
]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(requiredTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Revenue operating system should include target: ${requiredTarget}`);
}
for (const notToDo of [
  "blindly adding features",
  "low-quality AI article batches",
  "fake traffic",
  "fabricate customer stories",
  "guaranteed customer acceptance",
  "unlimited free consulting",
]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(notToDo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Revenue operating system should forbid: ${notToDo}`);
}
for (const forbiddenAnalyticsData of [
  "full report text",
  "customer names",
  "supplier names",
  "product names",
  "batch numbers",
  "attachment content",
  "full queries",
  "payment details",
  "share tokens",
  "passwords",
  "secrets",
]) {
  assert.match(revenueEvidenceOperatingSystem, new RegExp(forbiddenAnalyticsData.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Revenue operating system should forbid sensitive analytics data: ${forbiddenAnalyticsData}`);
}
assert.match(revenueEvidenceOperatingSystem, /Use production data only as observed customer behavior; do not create test\s*leads, test users, or test reports in production\./, "Revenue operating system should forbid production test data creation");
assert.doesNotMatch(revenueEvidenceOperatingSystem, /guaranteed approval|certified QMS|best in the world/i, "Revenue operating system should avoid unsupported commercial claims");

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
assert.match(draftRoute, /getReportAccess\(reportId, user\.id\)/, "AI Draft must use shared role and lock access gate");
assert.match(draftRoute, /access\.locked/, "AI Draft must reject locked reports before generation");
assert.match(draftRoute, /access\.canEdit/, "AI Draft must require edit permission before generation");
assert.match(draftRoute, /summarizeMaterialsForAi\(materials, reportData\)/, "AI Draft input must be built from current report data and user-provided materials");
assert.doesNotMatch(draftRoute, /currentReportData/, "AI Draft API must not trust client-sent currentReportData");
assert.doesNotMatch(draftRoute, /getAccessibleUserIds|reports\/search|reportActivities/, "AI Draft must not read unrelated reports, search results, or activity history");

const reportReviewRoute = read("src/app/api/ai/report-review/route.ts");
assert.match(reportReviewRoute, /isAiBetaUser/, "AI Quality Check must remain beta gated");
assert.match(reportReviewRoute, /getReportAccess\(reportId, user\.id\)/, "AI Quality Check must use shared role and lock access gate");
assert.match(reportReviewRoute, /access\.locked/, "AI Quality Check must reject locked reports before review");
assert.match(reportReviewRoute, /access\.canEdit/, "AI Quality Check must require edit permission before review");
assert.match(reportReviewRoute, /buildKnowledgeContextForQualityCheck\(report, user\)/, "AI Quality Check should build Knowledge Context after report access is resolved");
assert.match(reportReviewRoute, /summarizeReportForAi\(reportData, report\.title, knowledgeContext\)/, "AI Quality Check input must be built from the saved report and bounded Knowledge Context");
assert.match(reportReviewRoute, /knowledgeContext: knowledge/, "AI Quality Check should return only a safe Knowledge Context summary to the browser");
assert.doesNotMatch(reportReviewRoute, /getAccessibleReport|getAccessibleUserIds|reports\/search|reportActivities/, "AI Quality Check must not bypass shared report access or read unrelated data");

const aiKnowledgeContext = read("src/lib/ai/knowledge-context.ts");
assert.match(aiKnowledgeContext, /export async function buildKnowledgeContextForQualityCheck/, "AI Knowledge Context helper should exist");
assert.match(aiKnowledgeContext, /getAccessibleUserIds\(user\.id\)/, "AI Knowledge Context helper must reuse Team workspace access scope");
assert.match(aiKnowledgeContext, /searchKnowledgeEntries/, "AI Knowledge Context helper must reuse Knowledge Base eligibility and search behavior");
assert.match(aiKnowledgeContext, /QUALITY_CHECK_KNOWLEDGE_CONTEXT_LIMIT = 3/, "AI Knowledge Context helper should limit context to at most 3 reports");
assert.match(aiKnowledgeContext, /ne\(reports\.id, report\.id\)/, "AI Knowledge Context helper should exclude the current report from candidate rows");
assert.match(aiKnowledgeContext, /problemDescription[\s\S]*productName[\s\S]*customerName[\s\S]*confirmedRootCause[\s\S]*selectedCorrectiveAction/, "AI Knowledge Context helper should build seeds from the required current-report fields");
assert.doesNotMatch(aiKnowledgeContext, /reportShares|accessToken|share token/i, "AI Knowledge Context helper must not rely on public share tokens");
assert.doesNotMatch(aiKnowledgeContext, /\.insert\(|\.update\(|\.delete\(|CREATE TABLE|ALTER TABLE|drizzle-kit|migration/i, "AI Knowledge Context helper must remain read-only and avoid schema changes");

const aiPrompt = read("src/lib/ai/deepseek.ts");
assert.match(aiPrompt, /The following historical completed reports are provided only as reference context\./, "AI prompt should include reference-only context instruction");
assert.match(aiPrompt, /Do not treat them as proof that the current report is correct\./, "AI prompt should not let history prove current correctness");
assert.match(aiPrompt, /Do not copy them blindly\./, "AI prompt should forbid blind historical copying");
assert.match(aiPrompt, /Use them to identify missing checks, weak evidence, repeated failure patterns, and prevention opportunities\./, "AI prompt should focus historical context on review risks");
assert.match(aiPrompt, /You do not approve, certify, or submit the report/, "AI prompt should forbid approval behavior");
assert.match(aiPrompt, /knowledgeBasedObservations/, "AI prompt schema should include Knowledge-based observations");

const aiPayload = read("src/lib/ai/report-payload.ts");
assert.match(aiPayload, /knowledgeContext: QualityCheckKnowledgeContextItem\[\] = \[\]/, "AI report payload should accept optional Knowledge Context");
assert.match(aiPayload, /knowledgeContextStatus/, "AI report payload should tell the model when no context exists");

const aiReportTools = read("src/components/report/AiReportTools.tsx");
assert.match(aiReportTools, /Knowledge context used: \$\{context\.contextCount\} similar reports/, "AI UI should show Knowledge Context count");
assert.match(aiReportTools, /No reusable knowledge context found yet\./, "AI UI should show Knowledge Context empty state");
assert.match(aiReportTools, /Knowledge-based observations/, "AI UI should render Knowledge-based observations");
assert.match(aiReportTools, /ai_quality_check_knowledge_context_used/, "AI UI should track used-context analytics");
assert.match(aiReportTools, /ai_quality_check_knowledge_context_empty/, "AI UI should track empty-context analytics");
assert.match(aiReportTools, /source: "ai_quality_check"[\s\S]*contextCount[\s\S]*hasContext[\s\S]*plan/, "AI UI analytics metadata should stay safe and bounded");
assert.doesNotMatch(aiReportTools, /trackEvent\([\s\S]{0,320}(query:|problem:|rootCause:|correctiveAction:|lessonsLearned:|customer:|supplier:|product:|batch:|prompt:|rawAi:)/, "AI Knowledge Context analytics metadata must not include raw queries, report content, prompts, or raw AI output");

const aiKnowledgeSpec = read("docs/AI_QUALITY_CHECK_KNOWLEDGE_CONTEXT_SPEC.md");
assert.match(aiKnowledgeSpec, /reference-only/i, "AI Knowledge Context spec should define reference-only behavior");
assert.match(aiKnowledgeSpec, /V1 does not add:[\s\S]*Database schema changes or migrations/, "AI Knowledge Context spec should reject schema changes");
assert.match(aiKnowledgeSpec, /Allowed metadata only:[\s\S]*contextCount[\s\S]*hasContext[\s\S]*plan/, "AI Knowledge Context spec should document safe analytics metadata");

const schemaFile = read("src/lib/db/schema.ts");
assert.doesNotMatch(schemaFile, /knowledge_context|ai_knowledge|context_reports/i, "AI Knowledge Context v1 must not add database schema");

const loginForm = read("src/app/(auth)/login/login-form.tsx");
const signupForm = read("src/app/(auth)/signup/signup-form.tsx");
assert.doesNotMatch(loginForm, /signIn\.social|Google|GitHub|or continue with/, "Login page should not expose social login until it is stable");
assert.doesNotMatch(signupForm, /signIn\.social|Google|GitHub|or continue with/, "Signup page should not expose social login until it is stable");

const authConfig = read("src/lib/auth.ts");
assert.match(authConfig, /ENABLE_SOCIAL_LOGIN !== "true"/, "Social auth providers must be disabled unless explicitly enabled");
assert.match(authConfig, /socialProviders: getEnabledSocialProviders\(\)/, "Better Auth should use the gated social provider config");
assert.doesNotMatch(authConfig, /socialProviders:\s*\{\s*google:/, "Google auth must not be configured unconditionally");

assert.ok(SERVICE_REQUEST_TYPES.includes("assisted_8d"), "Service requests should include Assisted First 8D / SCAR Delivery as inquiry-only");
assert.match(pricingPage, /8D Template Setup[\s\S]*From \$499/, "Pricing should show Template Setup from $499");
assert.match(pricingPage, /Team Launch[\s\S]*From \$999/, "Pricing should show Team Launch from $999");
assert.match(pricingPage, /Assisted First 8D \/ SCAR Delivery[\s\S]*From \$799/, "Pricing should show Assisted First 8D / SCAR Delivery from $799");
assert.match(pricingPage, /pricing_service_cta_clicked/, "Pricing service CTA clicks should be tracked");
assert.match(homepage, /Need to submit a customer-ready 8D or SCAR this week\?/, "Homepage should speak to urgent customer-ready 8D/SCAR delivery");
assert.match(homepage, /Turn your Word \/ Excel 8D template into a reusable online workflow\./, "Homepage should promote template setup value");
assert.match(homepage, /For teams that need customer-ready 8D\/SCAR delivery before a full\s*QMS rollout\./, "Homepage should position services before full QMS rollout");

for (const revenueEvent of [
  "pricing_service_cta_clicked",
  "demo_report_downloaded",
  "template_setup_form_started",
  "template_setup_form_submitted",
  "template_setup_form_failed",
  "contact_form_submitted",
  "signup_started",
  "signup_completed",
  "export_attempted",
  "single_export_clicked",
]) {
  assert.match(eventsRoute, new RegExp(revenueEvent), `Events API should allow revenue evidence event: ${revenueEvent}`);
}

const analyticsClient = read("src/lib/analytics.ts");
assert.match(analyticsClient, /anonymousSessionId/, "Analytics should include anonymous session id for unauthenticated conversion evidence");
assert.match(analyticsClient, /referrer/, "Analytics should include referrer metadata");
assert.match(analyticsClient, /utm_source[\s\S]*utm_medium[\s\S]*utm_campaign/, "Analytics should include safe UTM metadata");
assert.doesNotMatch(analyticsClient, /window\.location\.search[\s\S]*metadata:\s*window\.location\.search/, "Analytics should not store the full URL query string");

assert.match(templateRequestRoute, /sendEmail/, "Template Setup API should send admin and user email notifications");
assert.match(templateRequestRoute, /Service request admin email failed/, "Admin email failures should be logged without blocking lead save");
assert.match(templateRequestRoute, /Service request auto-reply email failed/, "User auto-reply failures should be logged without blocking lead save");
assert.match(templateRequestRoute, /storage_unavailable/, "Template Setup API should preserve leads when storage is unavailable");
assert.match(templateRequestRoute, /fileUploadWarning/, "Template Setup API should return a file upload warning when files fail");
assert.match(templateRequestRoute, /\.insert\(customTemplateRequests\)/, "Template Setup API should save the lead in the existing service request table");
assert.doesNotMatch(templateRequestRoute, /getPublicUrl|url:\s*getPublicUrl|Storage service not configured/, "Template Setup API should not leak bucket URLs or fail the lead when storage is unavailable");

const customTemplateForm = read("src/components/marketing/CustomTemplateRequestForm.tsx");
for (const requiredLabel of [
  "Name",
  "Company name",
  "Work email",
  "Role",
  "Current process",
  "Use case",
  "Required export",
  "Timeline",
  "Message",
  "Template files",
]) {
  assert.match(customTemplateForm, new RegExp(requiredLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Template Setup form should include field: ${requiredLabel}`);
}
assert.match(customTemplateForm, /template_setup_form_started/, "Template Setup form should track started events");
assert.match(customTemplateForm, /template_setup_form_submitted/, "Template Setup form should track submitted events");
assert.match(customTemplateForm, /template_setup_form_failed/, "Template Setup form should track failed events");
assert.match(customTemplateForm, /fileUploadWarning/, "Template Setup form should show file upload warnings without losing the lead");

const serviceRequestsAdmin = read("src/components/admin/ServiceRequestsAdmin.tsx");
assert.match(serviceRequestsAdmin, /fileSize[\s\S]*mimeType[\s\S]*status/, "Service request admin should show file metadata");
assert.doesNotMatch(serviceRequestsAdmin, /href=\{file\.url\}|url\?: string/, "Service request admin should not expose private bucket URLs");

const adminMetricsPage = read("src/app/(app)/admin/metrics/page.tsx");
assert.match(adminMetricsPage, /isServiceAdmin/, "Revenue metrics page should be admin-only");
assert.match(adminMetricsPage, /analyticsEvents/, "Revenue metrics page should read analytics events");
assert.match(adminMetricsPage, /customTemplateRequests/, "Revenue metrics page should count saved service leads");
for (const metricLabel of [
  "Page views",
  "Demo downloads",
  "Template setup submissions",
  "Contact submissions",
  "Signup count",
  "Export attempts",
  "Pricing CTA clicks",
]) {
  assert.match(adminMetricsPage, new RegExp(metricLabel), `Revenue metrics page should show metric: ${metricLabel}`);
}

const sampleReportsRoute = read("src/app/api/sample-reports/[type]/route.ts");
assert.match(sampleReportsRoute, /format === "xlsx"/, "Demo sample API should support Excel downloads");
assert.match(sampleReportsRoute, /generateExcelWorkbook/, "Demo sample Excel should use the quality report workbook generator");
assert.match(sampleReportsRoute, /\.xlsx/, "Demo ZIP should include an Excel workbook");

const demoReportsPage = read("src/app/(marketing)/demo-reports/page.tsx");
const demoReportPage = read("src/app/(marketing)/demo-reports/[type]/page.tsx");
assert.match(demoReportsPage, /Download Excel/, "Demo reports index should expose Excel downloads");
assert.match(demoReportPage, /Excel/, "Demo detail should expose Excel downloads");
assert.match(demoReportsPage, /Want this in your company format\?/, "Demo reports index should include company-format CTA");
assert.match(demoReportPage, /Want this in your company format\?/, "Demo detail should include company-format CTA");
assert.match(demoReportPage, /Upload your current Word \/ Excel \/ PDF 8D template/, "Demo detail should ask users to upload their template");

const contactForm = read("src/components/marketing/ContactLeadForm.tsx");
assert.match(contactForm, /contact_form_submitted/, "Contact form should track submitted events");
assert.match(contactForm, /\/api\/feedback/, "Contact form should reuse existing feedback storage without schema changes");

const productionSmoke = read("scripts/production-smoke.test.ts");
assert.match(productionSmoke, /expectXlsx/, "Production smoke should verify demo Excel downloads");
assert.match(productionSmoke, /Want this in your company format\?/, "Production smoke should verify demo service CTA copy");

assert.match(authenticatedBrowserSmoke, /template setup lead capture/, "Authenticated smoke should cover Template Setup lead capture");
assert.match(authenticatedBrowserSmoke, /template_setup_form_started/, "Authenticated smoke should verify Template Setup started analytics");
assert.match(authenticatedBrowserSmoke, /template_setup_form_submitted/, "Authenticated smoke should verify Template Setup submitted analytics");
assert.match(authenticatedBrowserSmoke, /\/admin\/metrics/, "Authenticated smoke should verify admin metrics unauthenticated boundary");
assert.match(authenticatedBrowserSmoke, /anonymousSessionId/, "Authenticated smoke analytics safety should allow anonymous session id metadata");

assert.doesNotMatch(schemaFile, /revenue_metrics|lead_events|conversion_events/i, "Revenue Evidence Sprint v1 must not add database schema");

const productReviewBacklog = read("docs/PRODUCT_REVIEW_BACKLOG.md");
assert.match(productReviewBacklog, /# End-of-run Product Review Backlog/, "Product review backlog should exist");
assert.match(productReviewBacklog, /No P0 blockers were found/, "Product review backlog should state that there are no P0 blockers");
for (const reviewedSurface of [
  "Homepage",
  "Pricing",
  "Custom Template Setup",
  "Demo Reports",
  "Contact",
  "Signup",
  "Dashboard",
  "Report Editor",
  "Knowledge Base",
  "Revenue Admin Metrics",
]) {
  assert.match(productReviewBacklog, new RegExp(reviewedSurface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Product review backlog should cover: ${reviewedSurface}`);
}
for (const requiredColumn of [
  "Severity",
  "Evidence",
  "User Impact",
  "Suggested PR",
  "Not-to-do",
  "Expected metric impact",
]) {
  assert.match(productReviewBacklog, new RegExp(requiredColumn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Product review backlog should include column: ${requiredColumn}`);
}
for (const backlogMetric of [
  "template_setup_form_started",
  "template_setup_form_submitted",
  "demo download",
  "signup-to-first-report",
  "completed reports",
  "export attempts",
  "knowledge searches",
  "result open rate",
  "lead response speed",
]) {
  assert.match(productReviewBacklog, new RegExp(backlogMetric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Product review backlog should tie issues to metric impact: ${backlogMetric}`);
}
for (const futureOnlyBoundary of [
  "Full CRM",
  "Automated offsite posting",
  "Public marketing rewrite",
  "Payment, checkout, subscription, or pricing-amount changes",
  "Auth provider, password reset, or Resend infrastructure changes",
  "Export entitlement or report editor save-flow changes",
  "AI backend expansion",
  "Database schema migration",
  "vector database",
  "Knowledge Base permission, eligibility, or share-token logic changes",
]) {
  assert.match(productReviewBacklog, new RegExp(futureOnlyBoundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Product review backlog should preserve future-only boundary: ${futureOnlyBoundary}`);
}
assert.match(productReviewBacklog, /\| REV-P1-01 \|[\s\S]*\| REV-P2-14 \|/, "Product review backlog should include the full issue table");
assert.doesNotMatch(productReviewBacklog, /guaranteed acceptance|certified approval|we provide automatic AI approval|we are a full QMS/i, "Product review backlog should avoid unsupported product claims");

console.log("Team governance verification passed.");
