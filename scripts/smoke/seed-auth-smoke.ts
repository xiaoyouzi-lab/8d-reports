import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { configureSmokeDatabase, maskGithubSecret, writeGithubEnv } from "./smoke-safety";

const OWNER_EMAIL = "smoke-owner@example.test";
const MEMBER_EMAIL = "smoke-member@example.test";
const OUTSIDER_EMAIL = "smoke-outsider@example.test";
const SMOKE_PASSWORD = "SmokeTest#2026!";
// Pending invite for a registered user who has NOT accepted yet. The disabled
// smoke flow uses this to prove pending members have no team scope until they
// accept, then gain access and lose it again after revoke.
const PENDING_INVITE_TOKEN = "smoke-pending-invite-token";
const smokeEmails = [OWNER_EMAIL, MEMBER_EMAIL, OUTSIDER_EMAIL];
const now = new Date();
const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

type SignUpEmail = (input: { body: { email: string; password: string; name: string } }) => Promise<unknown>;

// TODO(team-auth strict separation): this seed prepares the fixtures for a
// disposable-DB smoke that cannot run offline. Before any production rollout,
// run against a temporary Neon branch and verify:
//   1. Owner GET /api/reports does NOT include SMOKE_MEMBER_PERSONAL_REPORT_ID
//      (member's pre-join personal report) and does NOT include the outsider report.
//   2. Outsider (pending invite) GET /api/reports and POST /api/knowledge/search
//      exclude all team-scoped reports before accepting.
//   3. Outsider POST /api/team/accept { token: SMOKE_PENDING_INVITE_TOKEN } -> 200,
//      then the team-scoped reports become visible and the personal report does not.
//   4. Owner revokes the accepted member / outsider invite, and access is gone.
// See docs/TEAM_AUTHORIZATION_FIX_SPEC.md and docs/DEV_LOG.md for the exact steps.

function smokeReportData(overrides: Record<string, unknown> = {}) {
  return {
    reportNumber: "KB-SMOKE-001",
    teamMembers: "Quality engineer, production supervisor, process owner",
    problemDescription: "Customer found coating peel-off on brake bracket batch KB-001.",
    productName: "Brake bracket",
    customerName: "KB Test Customer",
    batchNumber: "KB-001",
    containmentAction: "Hold affected lots and inspect all brake brackets produced during the line-change window.",
    rootCauseOccurrence: "Fixture cleaning check was skipped before line change.",
    rootCauseEscape: "Outgoing inspection did not check coating edge adhesion.",
    confirmedRootCause: "Fixture cleaning control was not verified during line change.",
    selectedCorrectiveAction: "Add mandatory fixture cleaning sign-off before production restart.",
    implementationPlan: "Update startup checklist and retrain shift operators.",
    validationResults: "Three follow-up lots passed coating adhesion checks.",
    systemChanges: "Layered audit checklist updated.",
    processUpdates: "Line change work instruction updated.",
    lessonsLearned: "Line-change controls must include fixture cleaning verification.",
    ...overrides,
  };
}

function stepStatus(status = "completed") {
  return {
    d0: status,
    d1: status,
    d2: status,
    d3: status,
    d4: status,
    d5: status,
    d6: status,
    d7: status,
    d8: status,
  };
}

async function main() {
  configureSmokeDatabase();

  const { auth } = await import("../../src/lib/auth");
  const { db } = await import("../../src/lib/db");
  const schema = await import("../../src/lib/db/schema");

  const {
    users,
    plans,
    subscriptions,
    teamWorkspaces,
    teamMembers,
    reports,
  } = schema;

  async function createSmokeUser(email: string, name: string) {
    const signUpEmail = auth.api.signUpEmail as SignUpEmail;
    await signUpEmail({ body: { email, password: SMOKE_PASSWORD, name } });
    await db.update(users).set({ emailVerified: true, updatedAt: now }).where(eq(users.email, email));
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) throw new Error(`Smoke user was not created: ${email}`);
    return user;
  }

  await db.delete(users).where(inArray(users.email, smokeEmails));

  await db.insert(plans).values([
  {
    creemProductId: "smoke_free_plan",
    name: "Free",
    description: "Smoke free plan",
    priceMonthly: "0",
    priceYearly: "0",
    reportsPerMonth: 3,
    maxTeamMembers: 1,
    features: ["smoke"],
    isActive: true,
  },
  {
    creemProductId: "smoke_team_plan",
    name: "Team",
    description: "Smoke Team plan",
    priceMonthly: "49",
    priceYearly: "490",
    reportsPerMonth: -1,
    maxTeamMembers: 5,
    features: ["team", "workflow", "knowledge"],
    isActive: true,
  },
  ]).onConflictDoUpdate({
    target: plans.creemProductId,
    set: {
      isActive: true,
      reportsPerMonth: -1,
      maxTeamMembers: 5,
    },
  });

  const owner = await createSmokeUser(OWNER_EMAIL, "Smoke Owner");
  const member = await createSmokeUser(MEMBER_EMAIL, "Smoke Member");
  const outsider = await createSmokeUser(OUTSIDER_EMAIL, "Smoke Outsider");

  const [teamPlan] = await db.select().from(plans).where(eq(plans.creemProductId, "smoke_team_plan"));
  if (!teamPlan) throw new Error("Smoke Team plan was not available after seeding.");

  await db.insert(subscriptions).values({
  userId: owner.id,
  planId: teamPlan.id,
  creemSubscriptionId: "smoke-team-subscription",
  creemCustomerId: "smoke-team-customer",
  status: "active",
  currentPeriodStart: now,
  currentPeriodEnd: future,
  cancelAtPeriodEnd: false,
  reportsUsedThisPeriod: 0,
  });

  const [team] = await db.insert(teamWorkspaces).values({
  ownerId: owner.id,
  name: "Smoke Quality Team",
  maxSeats: 5,
  }).returning();

  await db.insert(teamMembers).values([
    { teamId: team.id, userId: owner.id, role: "owner", status: "accepted", acceptedAt: now },
    { teamId: team.id, userId: member.id, role: "editor", status: "accepted", acceptedAt: now },
  ]);

  // Registered but not yet accepted: must have no team report scope.
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: outsider.id,
    invitedEmail: OUTSIDER_EMAIL,
    role: "viewer",
    status: "pending",
    inviteTokenHash: createHash("sha256").update(PENDING_INVITE_TOKEN).digest("hex"),
    inviteExpiresAt: future,
  });

  const insertedReports = await db.insert(reports).values([
  {
    userId: owner.id,
    teamId: team.id,
    title: "KB Smoke Test - Coating Peel-off",
    status: "completed",
    workflowStatus: "draft",
    revision: 0,
    reportType: "customer_8d",
    priority: "high",
    source: "customer complaint",
    data: smokeReportData(),
    stepStatus: stepStatus(),
    hasConsumedQuota: true,
    updatedAt: now,
  },
  {
    userId: owner.id,
    teamId: team.id,
    title: "KB Smoke Test - Closed Bearing Noise",
    status: "completed",
    workflowStatus: "closed",
    revision: 1,
    lockedAt: now,
    lockedBy: owner.id,
    reportType: "customer_8d",
    priority: "medium",
    source: "field return",
    data: smokeReportData({
      reportNumber: "KB-SMOKE-002",
      problemDescription: "Bearing noise returned after final assembly run-in.",
      productName: "Bearing module",
      customerName: "KB Closed Customer",
      confirmedRootCause: "Grease fill target was not updated after supplier packaging changed.",
      selectedCorrectiveAction: "Add grease weight verification and supplier packaging change review.",
      validationResults: "Closed validation lots passed run-in noise and torque checks.",
      lessonsLearned: "Packaging changes can affect grease distribution and need process-owner review.",
    }),
    stepStatus: stepStatus(),
    hasConsumedQuota: true,
    updatedAt: now,
  },
  {
    userId: owner.id,
    teamId: team.id,
    title: "KB Smoke Test - Draft Containment",
    status: "draft",
    workflowStatus: "draft",
    reportType: "customer_8d",
    priority: "high",
    source: "customer complaint",
    data: smokeReportData({
      reportNumber: "KB-SMOKE-DRAFT",
      rootCauseOccurrence: "",
      rootCauseEscape: "",
      rootCauseSystem: "",
      why1: "",
      why2: "",
      why3: "",
      why4: "",
      why5: "",
      testingResults: "",
      confirmedRootCause: "",
      selectedCorrectiveAction: "",
      correctiveRationale: "",
      implementationPlan: "",
      validationMethod: "",
      validationResults: "",
      systemChanges: "",
      processUpdates: "",
      horizontalDeployment: "",
      trainingNeeds: "",
      lessonsLearned: "",
    }),
    stepStatus: stepStatus("draft"),
    updatedAt: now,
  },
  {
    userId: owner.id,
    teamId: team.id,
    title: "KB Smoke Test - In Progress Torque",
    status: "in_progress",
    workflowStatus: "draft",
    reportType: "customer_8d",
    priority: "medium",
    source: "internal audit",
    data: smokeReportData({ reportNumber: "KB-SMOKE-INPROGRESS" }),
    stepStatus: stepStatus("in_progress"),
    updatedAt: now,
  },
  {
    userId: owner.id,
    teamId: team.id,
    title: "KB Smoke Test - Internal Review Leak",
    status: "completed",
    workflowStatus: "internal_review",
    reportType: "internal_8d",
    priority: "critical",
    source: "internal review",
    data: smokeReportData({ reportNumber: "KB-SMOKE-REVIEW" }),
    stepStatus: stepStatus(),
    updatedAt: now,
  },
  {
    userId: outsider.id,
    title: "KB Smoke Test - Outsider Visible Risk",
    status: "completed",
    workflowStatus: "closed",
    lockedAt: now,
    lockedBy: outsider.id,
    reportType: "customer_8d",
    priority: "critical",
    source: "customer complaint",
    data: smokeReportData({ reportNumber: "KB-SMOKE-OUTSIDER" }),
    stepStatus: stepStatus(),
    updatedAt: now,
  },
  {
    userId: member.id,
    teamId: team.id,
    title: "KB Smoke Test - Member Approved Internal 8D",
    status: "completed",
    workflowStatus: "approved",
    lockedAt: now,
    lockedBy: owner.id,
    reportType: "internal_8d",
    priority: "high",
    source: "process audit",
    data: smokeReportData({
      reportNumber: "KB-SMOKE-MEMBER",
      problemDescription: "Internal audit found repeated fixture cleaning miss on second shift.",
      productName: "Internal coating line",
      customerName: "Internal Team",
      confirmedRootCause: "Shift handover did not include fixture cleaning status.",
      selectedCorrectiveAction: "Add shift-handover fixture status check and quality sign-off.",
      validationResults: "Approved internal audit follow-up showed no repeated fixture cleaning misses.",
      lessonsLearned: "Team-owned process knowledge should be visible to the workspace owner.",
    }),
    stepStatus: stepStatus(),
    updatedAt: now,
  },
  {
    // Deliberately personal (teamId stays null): a member's own report must
    // remain invisible to the owner and other members under strict separation.
    userId: member.id,
    title: "KB Smoke Test - Member Personal Pre-Join",
    status: "completed",
    workflowStatus: "closed",
    lockedAt: now,
    lockedBy: member.id,
    reportType: "internal_8d",
    priority: "critical",
    source: "personal",
    data: smokeReportData({
      reportNumber: "KB-SMOKE-PREJOIN",
      problemDescription: "Personal pre-join notes about fixture cleaning that must stay private.",
      productName: "Personal notebook",
      customerName: "Member Personal",
      confirmedRootCause: "Pre-join personal analysis must not become team-visible.",
      selectedCorrectiveAction: "Keep personal reports personal until explicitly team-scoped.",
      lessonsLearned: "Joining a team must not retroactively expose personal history.",
    }),
    stepStatus: stepStatus(),
    updatedAt: now,
  },
  ]).returning({
    id: reports.id,
    title: reports.title,
  });

  const reportByTitle = new Map(insertedReports.map((report) => [report.title, report.id]));
  const completedReportId = reportByTitle.get("KB Smoke Test - Coating Peel-off") || "";
  const closedReportId = reportByTitle.get("KB Smoke Test - Closed Bearing Noise") || "";
  const memberReportId = reportByTitle.get("KB Smoke Test - Member Approved Internal 8D") || "";
  const draftReportId = reportByTitle.get("KB Smoke Test - Draft Containment") || "";
  const memberPersonalReportId = reportByTitle.get("KB Smoke Test - Member Personal Pre-Join") || "";

  maskGithubSecret(SMOKE_PASSWORD);
  writeGithubEnv({
    SMOKE_OWNER_EMAIL: OWNER_EMAIL,
    SMOKE_OWNER_PASSWORD: SMOKE_PASSWORD,
    SMOKE_COMPLETED_REPORT_ID: completedReportId,
    SMOKE_CLOSED_REPORT_ID: closedReportId,
    SMOKE_MEMBER_REPORT_ID: memberReportId,
    SMOKE_DRAFT_REPORT_ID: draftReportId,
    SMOKE_MEMBER_PERSONAL_REPORT_ID: memberPersonalReportId,
    SMOKE_PENDING_INVITE_TOKEN: PENDING_INVITE_TOKEN,
  });

  console.log("Authenticated smoke fixtures seeded", {
    users: smokeEmails.length,
    reports: insertedReports.length,
    ownerEmail: OWNER_EMAIL,
    completedReportId,
    closedReportId,
    memberReportId,
    draftReportId,
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Authenticated smoke seed failed");
  process.exit(1);
});
