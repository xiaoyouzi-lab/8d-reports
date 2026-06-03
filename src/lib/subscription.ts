import { db } from "@/lib/db";
import { plans, reportPurchases, subscriptions, teamMembers, teamWorkspaces } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getPlanFromName, PLAN_ENTITLEMENTS, type PlanEntitlements, type PlanKey } from "@/lib/plans";

const ACTIVE_STATUSES = new Set(["active", "trialing", "paid"]);

export function isActiveStatus(status?: string | null) {
  return ACTIVE_STATUSES.has(status || "");
}

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const directRows = await db
    .select({ status: subscriptions.status, planName: plans.name })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.userId, userId));

  const direct = directRows.find((subscription) => isActiveStatus(subscription.status));
  const directPlan = getPlanFromName(direct?.planName);
  if (directPlan !== "free") return directPlan;

  const memberships = await db
    .select({ ownerId: teamWorkspaces.ownerId })
    .from(teamMembers)
    .innerJoin(teamWorkspaces, eq(teamMembers.teamId, teamWorkspaces.id))
    .where(eq(teamMembers.userId, userId));

  const ownerIds = memberships.map((membership) => membership.ownerId);
  if (ownerIds.length === 0) return "free";

  const ownerSubscriptions = await db
    .select({ status: subscriptions.status, planName: plans.name })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(inArray(subscriptions.userId, ownerIds));

  return ownerSubscriptions.some((subscription) =>
    isActiveStatus(subscription.status) && getPlanFromName(subscription.planName) === "team"
  ) ? "team" : "free";
}

export async function getUserEntitlements(userId: string): Promise<PlanEntitlements> {
  const plan = await getUserPlan(userId);
  return PLAN_ENTITLEMENTS[plan];
}

export async function isUserPro(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "pro" || plan === "team";
}

export async function isUserTeam(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "team";
}

export async function hasSingleReportExport(userId: string, reportId: string): Promise<boolean> {
  const [purchase] = await db
    .select({ id: reportPurchases.id })
    .from(reportPurchases)
    .where(and(
      eq(reportPurchases.userId, userId),
      eq(reportPurchases.reportId, reportId),
      eq(reportPurchases.status, "active"),
    ))
    .limit(1);

  return Boolean(purchase);
}

export async function canExportReportWithoutWatermark(userId: string, reportId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);
  if (!entitlements.pdfWatermark && entitlements.wordExport) return true;
  return hasSingleReportExport(userId, reportId);
}
