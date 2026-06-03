import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { getUserEntitlements } from "@/lib/subscription";
import { getAccessibleUserIds } from "@/lib/report-access";
import { desc, inArray } from "drizzle-orm";

const SEARCH_FIELDS: Array<{ key: string; label: string }> = [
  { key: "problemDescription", label: "Problem Description" },
  { key: "productName", label: "Product" },
  { key: "batchNumber", label: "Batch" },
  { key: "customerName", label: "Customer" },
  { key: "containmentDescription", label: "Containment" },
  { key: "rootCauseOccurrence", label: "Root Cause" },
  { key: "rootCauseEscape", label: "Escape Cause" },
  { key: "rootCauseSystem", label: "System Cause" },
  { key: "fishboneMan", label: "Fishbone Man / People" },
  { key: "fishboneMachine", label: "Fishbone Machine / Equipment" },
  { key: "fishboneMaterial", label: "Fishbone Material" },
  { key: "fishboneMethod", label: "Fishbone Method / Process" },
  { key: "fishboneMeasurement", label: "Fishbone Measurement / Inspection" },
  { key: "fishboneEnvironment", label: "Fishbone Environment" },
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

  const entitlements = await getUserEntitlements(user.id);
  if (!entitlements.deepSearch) {
    return NextResponse.json(
      { error: "Deep historical search is a Pro or Team feature" },
      { status: 403 }
    );
  }

  const query = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const accessibleUserIds = await getAccessibleUserIds(user.id);
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
    .where(inArray(reports.userId, accessibleUserIds))
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

      const reportNumber = typeof data.reportNumber === "string" ? data.reportNumber : "";
      if (reportNumber.toLowerCase().includes(query)) {
        return { ...report, matchSnippet: getSnippet("Report Number", reportNumber, query) };
      }

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
      reportNumber: typeof (result.data as Record<string, unknown>)?.reportNumber === "string"
        ? (result.data as Record<string, unknown>).reportNumber
        : null,
      matchSnippet: result.matchSnippet,
    }));

  return NextResponse.json(results);
}
