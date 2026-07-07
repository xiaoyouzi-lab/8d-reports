import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, userQuotas } from "@/lib/db/schema";
import { FREE_REPORT_LIMIT } from "@/lib/plans";
import type { ReportData } from "@/lib/report-steps";
import { getUserEntitlements } from "@/lib/subscription";
import { getUserWorkspaceRole, logReportActivity } from "@/lib/report-workflow";

export const REPORT_TYPES = new Set(["customer_8d", "internal_8d"]);
export const REPORT_PRIORITIES = new Set(["low", "medium", "high"]);

export interface ReportCreationUser {
  id: string;
  name?: string | null;
}

export interface CreateReportFromDataInput {
  user: ReportCreationUser;
  title?: string;
  reportType?: unknown;
  priority?: unknown;
  data?: Partial<ReportData>;
  source?: string | null;
  status?: "draft" | "in_progress" | "completed";
  stepStatus?: Record<string, unknown>;
  now?: Date;
}

export type CreateReportFromDataResult =
  | {
      ok: true;
      report: typeof reports.$inferSelect;
    }
  | {
      ok: false;
      status: number;
      body: { error: string };
    };

export function normalizeReportType(value: unknown) {
  return typeof value === "string" && REPORT_TYPES.has(value) ? value : "customer_8d";
}

export function normalizeReportPriority(value: unknown) {
  return typeof value === "string" && REPORT_PRIORITIES.has(value) ? value : "medium";
}

function normalizeReportTitle(value: unknown) {
  if (typeof value !== "string") return "Untitled Report";
  const trimmed = value.trim();
  return trimmed || "Untitled Report";
}

export async function createReportFromData(input: CreateReportFromDataInput): Promise<CreateReportFromDataResult> {
  const reportType = normalizeReportType(input.reportType);
  const priority = normalizeReportPriority(input.priority);
  const entitlements = await getUserEntitlements(input.user.id);

  if (entitlements.plan === "team" && await getUserWorkspaceRole(input.user.id) === "viewer") {
    return {
      ok: false,
      status: 403,
      body: { error: "Viewers cannot create reports. Ask the Team owner to change your role." },
    };
  }

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, input.user.id))
    .limit(1);

  const totalQuota = quota?.totalQuota ?? FREE_REPORT_LIMIT;
  const usedQuota = quota?.usedQuota ?? 0;

  if (!entitlements.unlimitedReports && usedQuota >= totalQuota) {
    return {
      ok: false,
      status: 403,
      body: { error: "Quota exhausted. Upgrade to Pro or Team to create more reports." },
    };
  }

  const today = input.now || new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayReports = await db
    .select({ count: sql<number>`count(*)` })
    .from(reports)
    .where(and(
      eq(reports.userId, input.user.id),
      gte(reports.createdAt, startOfDay),
      lte(reports.createdAt, endOfDay),
    ));

  const todayCount = (todayReports[0]?.count ?? 0) + 1;
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const seq = String(todayCount).padStart(3, "0");
  const reportNumber = `${y}-${m}-${d}-${seq}`;
  const reportData: Partial<ReportData> = {
    reportNumber,
    ...(input.data || {}),
  };

  const [report] = await db
    .insert(reports)
    .values({
      userId: input.user.id,
      title: normalizeReportTitle(input.title),
      reportType,
      priority,
      source: input.source ?? null,
      status: input.status || "draft",
      data: reportData,
      stepStatus: input.stepStatus || {},
      hasConsumedQuota: true,
    })
    .returning();

  if (entitlements.unlimitedReports) {
    // Paid plans have unlimited reports; keep quota rows informational only.
  } else if (!quota) {
    await db.insert(userQuotas).values({
      userId: input.user.id,
      totalQuota: FREE_REPORT_LIMIT,
      usedQuota: 1,
    });
  } else {
    await db
      .update(userQuotas)
      .set({ usedQuota: usedQuota + 1, updatedAt: new Date() })
      .where(eq(userQuotas.userId, input.user.id));
  }

  await logReportActivity({
    reportId: report.id,
    actorId: input.user.id,
    actorName: input.user.name,
    actionType: "report_created",
  });

  return { ok: true, report };
}
