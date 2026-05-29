import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports, userQuotas } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { isUserPro } from "@/lib/subscription";

const REPORT_TYPES = new Set(["customer_8d", "internal_8d"]);
const PRIORITIES = new Set(["low", "medium", "high"]);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const rows = await db
    .select({
      id: reports.id,
      title: reports.title,
      status: reports.status,
      reportType: reports.reportType,
      priority: reports.priority,
      source: reports.source,
      data: reports.data,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(eq(reports.userId, user.id))
    .orderBy(desc(reports.updatedAt));

  return NextResponse.json(rows.map((report) => {
    const data = typeof report.data === "object" && report.data
      ? report.data as Record<string, unknown>
      : {};
    return {
      id: report.id,
      title: report.title,
      status: report.status,
      reportType: report.reportType,
      priority: report.priority,
      source: report.source,
      reportNumber: typeof data.reportNumber === "string" ? data.reportNumber : null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const reportType = REPORT_TYPES.has(body.reportType) ? body.reportType : "customer_8d";
  const priority = PRIORITIES.has(body.priority) ? body.priority : "medium";
  const isPro = await isUserPro(user.id);

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  const totalQuota = quota?.totalQuota ?? 5;
  const usedQuota = quota?.usedQuota ?? 0;

  if (!isPro && usedQuota >= totalQuota) {
    return NextResponse.json(
      { error: "Quota exhausted. Upgrade to Pro to create more reports." },
      { status: 403 }
    );
  }

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayReports = await db
    .select({ count: sql<number>`count(*)` })
    .from(reports)
    .where(and(
      eq(reports.userId, user.id),
      gte(reports.createdAt, startOfDay),
      lte(reports.createdAt, endOfDay),
    ));

  const todayCount = (todayReports[0]?.count ?? 0) + 1;
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const seq = String(todayCount).padStart(3, "0");
  const reportNumber = `${y}-${m}-${d}-${seq}`;

  const [report] = await db
    .insert(reports)
    .values({
      userId: user.id,
      title: "Untitled Report",
      reportType,
      priority,
      data: { reportNumber },
      stepStatus: {},
      hasConsumedQuota: true,
    })
    .returning();

  if (isPro) {
    // Pro users have unlimited reports; keep quota rows informational only.
  } else if (!quota) {
    await db.insert(userQuotas).values({
      userId: user.id,
      totalQuota: 5,
      usedQuota: 1,
    });
  } else {
    await db
      .update(userQuotas)
      .set({ usedQuota: usedQuota + 1, updatedAt: new Date() })
      .where(eq(userQuotas.userId, user.id));
  }

  return NextResponse.json(report, { status: 201 });
}
