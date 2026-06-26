import { NextRequest, NextResponse } from "next/server";
import { and, desc, inArray, or, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { getAccessibleUserIds } from "@/lib/report-access";
import {
  KNOWLEDGE_SCAN_LIMIT,
  KNOWLEDGE_SEARCH_LIMIT,
  KNOWLEDGE_WORKFLOW_STATUSES,
  normalizeKnowledgeFilter,
  searchKnowledgeEntries,
} from "@/lib/report-knowledge";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const query = (typeof body.q === "string" ? body.q : "").trim();
  const filter = normalizeKnowledgeFilter(body.status);
  const accessibleUserIds = await getAccessibleUserIds(user.id);

  const rows = await db
    .select({
      id: reports.id,
      title: reports.title,
      status: reports.status,
      workflowStatus: reports.workflowStatus,
      revision: reports.revision,
      lockedAt: reports.lockedAt,
      reportType: reports.reportType,
      priority: reports.priority,
      source: reports.source,
      data: reports.data,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(and(
      inArray(reports.userId, accessibleUserIds),
      or(
        eq(reports.status, "completed"),
        inArray(reports.workflowStatus, [...KNOWLEDGE_WORKFLOW_STATUSES]),
      ),
    ))
    .orderBy(desc(reports.updatedAt))
    .limit(KNOWLEDGE_SCAN_LIMIT);

  return NextResponse.json({
    results: searchKnowledgeEntries(rows, {
      query,
      filter,
      limit: KNOWLEDGE_SEARCH_LIMIT,
    }),
    queryLength: query.length,
    filter,
  });
}
