import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { isUserPro } from "@/lib/subscription";
import { desc, eq } from "drizzle-orm";

const SEARCH_FIELDS: Array<{ key: string; label: string }> = [
  { key: "problemDescription", label: "Problem Description" },
  { key: "productName", label: "Product" },
  { key: "batchNumber", label: "Batch" },
  { key: "customerName", label: "Customer" },
  { key: "containmentDescription", label: "Containment" },
  { key: "rootCauseOccurrence", label: "Root Cause" },
  { key: "rootCauseEscape", label: "Escape Cause" },
  { key: "rootCauseSystem", label: "System Cause" },
  { key: "confirmedRootCause", label: "Confirmed Root Cause" },
  { key: "selectedCorrectiveAction", label: "Corrective Action" },
  { key: "systemChanges", label: "Prevention" },
  { key: "processUpdates", label: "Process Update" },
  { key: "horizontalDeployment", label: "Horizontal Deployment" },
  { key: "lessonsLearned", label: "Lessons Learned" },
];

type SearchMatch = {
  id: string;
  title: string;
  status: string;
  reportType: string;
  priority: string;
  source: string | null;
  data: unknown;
  updatedAt: Date;
  matchSnippet: string;
};

function getSnippet(label: string, value: string, query: string) {
  const lower = value.toLowerCase();
  const index = lower.indexOf(query);
  const start = Math.max(0, index - 45);
  const end = Math.min(value.length, index + query.length + 75);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < value.length ? "..." : "";
  return `${label} matched: ${prefix}${value.slice(start, end)}${suffix}`;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const pro = await isUserPro(user.id);
  if (!pro) {
    return NextResponse.json(
      { error: "Deep historical search is a Pro feature" },
      { status: 403 }
    );
  }

  const query = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const rows = await db
    .select({
      id: reports.id,
      title: reports.title,
      status: reports.status,
      reportType: reports.reportType,
      priority: reports.priority,
      source: reports.source,
      data: reports.data,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(eq(reports.userId, user.id))
    .orderBy(desc(reports.updatedAt));

  const results = rows
    .map((report) => {
      const title = report.title || "";
      if (title.toLowerCase().includes(query)) {
        return { ...report, matchSnippet: getSnippet("Title", title, query) };
      }

      const data = typeof report.data === "object" && report.data
        ? report.data as Record<string, unknown>
        : {};

      for (const field of SEARCH_FIELDS) {
        const value = data[field.key];
        if (typeof value === "string" && value.toLowerCase().includes(query)) {
          return {
            ...report,
            matchSnippet: getSnippet(field.label, value, query),
          };
        }
      }

      return null;
    })
    .filter((result): result is SearchMatch => result !== null)
    .map((result) => ({
      id: result.id,
      title: result.title,
      status: result.status,
      reportType: result.reportType,
      priority: result.priority,
      source: result.source,
      updatedAt: result.updatedAt,
      matchSnippet: result.matchSnippet,
    }));

  return NextResponse.json(results);
}
