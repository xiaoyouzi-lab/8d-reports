import { eq, inArray } from "drizzle-orm";
import { configureSmokeDatabase, maskGithubSecret, writeGithubEnv } from "./smoke-safety";

const OWNER_EMAIL = "smoke-owner@example.test";
const MEMBER_EMAIL = "smoke-member@example.test";
const OUTSIDER_EMAIL = "smoke-outsider@example.test";
const SMOKE_PASSWORD = "SmokeTest#2026!";
const smokeEmails = [OWNER_EMAIL, MEMBER_EMAIL, OUTSIDER_EMAIL];
const now = new Date();
const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

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

type SignUpEmail = (input: { body: { email: string; password: string; name: string } }) => Promise<unknown>;

async function createSmokeUser(email: string, name: string) {
  const signUpEmail = auth.api.signUpEmail as SignUpEmail;
  await signUpEmail({ body: { email, password: SMOKE_PASSWORD, name } });
  await db.update(users).set({ emailVerified: true, updatedAt: now }).where(eq(users.email, email));
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new Error(`Smoke user was not created: ${email}`);
  return user;
}

function smokeReportData(overrides: Record<string, unknown> = {}) {
  return {
    reportNumber: "KB-SMOKE-001",
    teamMembers: "Quality engineer, production supervisor, process owner",
    problemDescription: "Customer found coating peel-off on brake bracket after salt-spray exposure.",
    productName: "Brake bracket",
    customerName: "KB Test Customer",
    batchNumber: "KB-SMOKE-BATCH-001",
    containmentAction: "Hold affected lots and inspect all brake brackets produced during the line-change window.",
    rootCauseOccurrence: "Fixture cleaning was skipped after a line-change because the setup checklist did not require sign-off.",
    rootCauseEscape: "Outgoing inspection sampled appearance only and did not verify adhesion after the coating line change.",
    confirmedRootCause: "Fixture cleaning and line-change controls allowed coating contamination to remain before primer.",
    selectedCorrectiveAction: "Add fixture-cleaning sign-off, adhesion verification, and supervisor approval before production release.",
    implementationPlan: "Update setup checklist, train operators, and require quality approval for the first three lots after line change.",
    validationResults: "Three consecutive lots passed cross-hatch adhesion and salt-spray verification with no peel-off.",
    systemChanges: "Line-change checklist now requires fixture cleaning sign-off and quality release approval.",
    processUpdates: "Outgoing inspection now includes adhesion verification for the first lot after coating setup changes.",
    lessonsLearned: "Line-change controls need independent quality approval when coating adhesion risk is present.",
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
  { teamId: team.id, userId: owner.id, role: "owner" },
  { teamId: team.id, userId: member.id, role: "editor" },
]);

const insertedReports = await db.insert(reports).values([
  {
    userId: owner.id,
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
    title: "KB Smoke Test - Draft Containment",
    status: "draft",
    workflowStatus: "draft",
    reportType: "customer_8d",
    priority: "high",
    source: "customer complaint",
    data: smokeReportData({ reportNumber: "KB-SMOKE-DRAFT" }),
    stepStatus: stepStatus("draft"),
    updatedAt: now,
  },
  {
    userId: owner.id,
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
]).returning({
  id: reports.id,
  title: reports.title,
});

const reportByTitle = new Map(insertedReports.map((report) => [report.title, report.id]));
const completedReportId = reportByTitle.get("KB Smoke Test - Coating Peel-off") || "";
const closedReportId = reportByTitle.get("KB Smoke Test - Closed Bearing Noise") || "";
const memberReportId = reportByTitle.get("KB Smoke Test - Member Approved Internal 8D") || "";

maskGithubSecret(SMOKE_PASSWORD);
writeGithubEnv({
  SMOKE_OWNER_EMAIL: OWNER_EMAIL,
  SMOKE_OWNER_PASSWORD: SMOKE_PASSWORD,
  SMOKE_COMPLETED_REPORT_ID: completedReportId,
  SMOKE_CLOSED_REPORT_ID: closedReportId,
  SMOKE_MEMBER_REPORT_ID: memberReportId,
});

console.log("Authenticated smoke fixtures seeded", {
  users: smokeEmails.length,
  reports: insertedReports.length,
  ownerEmail: OWNER_EMAIL,
  completedReportId,
  closedReportId,
  memberReportId,
});
