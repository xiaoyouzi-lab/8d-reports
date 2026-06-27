import type { reports } from "@/lib/db/schema";

export const KNOWLEDGE_WORKFLOW_STATUSES = ["approved", "submitted", "closed"] as const;
export const KNOWLEDGE_REPORT_TYPES = ["customer_8d", "internal_8d"] as const;
export const KNOWLEDGE_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export const KNOWLEDGE_SEARCH_LIMIT = 50;
export const KNOWLEDGE_SCAN_LIMIT = 250;

export type KnowledgeWorkflowStatus = (typeof KNOWLEDGE_WORKFLOW_STATUSES)[number];
export type KnowledgeFilter = "all" | "completed" | KnowledgeWorkflowStatus;
export type KnowledgeReportTypeFilter = "all" | (typeof KNOWLEDGE_REPORT_TYPES)[number];
export type KnowledgePriorityFilter = "all" | (typeof KNOWLEDGE_PRIORITIES)[number];

export const KNOWLEDGE_FILTERS: KnowledgeFilter[] = ["all", "completed", ...KNOWLEDGE_WORKFLOW_STATUSES];
export const KNOWLEDGE_REPORT_TYPE_FILTERS: KnowledgeReportTypeFilter[] = ["all", ...KNOWLEDGE_REPORT_TYPES];
export const KNOWLEDGE_PRIORITY_FILTERS: KnowledgePriorityFilter[] = ["all", ...KNOWLEDGE_PRIORITIES];

type ReportLike = Pick<
  typeof reports.$inferSelect,
  "id" | "title" | "status" | "workflowStatus" | "revision" | "lockedAt" | "reportType" | "priority" | "source" | "data" | "updatedAt" | "createdAt"
>;

export interface KnowledgeEntry {
  id: string;
  title: string;
  reportNumber: string | null;
  status: string;
  workflowStatus: string | null;
  trustLabel: string;
  revision: number;
  lockedAt: Date | null;
  reportType: string;
  priority: string;
  source: string | null;
  problem: string | null;
  product: string | null;
  customer: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  lessonsLearned: string | null;
  prevention: string | null;
  validation: string | null;
  matchSnippet: string | null;
  matchedField: string | null;
  updatedAt: Date;
  createdAt: Date;
}

const SEARCH_FIELDS: Array<{ key: keyof KnowledgeEntry; label: string }> = [
  { key: "title", label: "Title" },
  { key: "reportNumber", label: "Report Number" },
  { key: "problem", label: "Problem" },
  { key: "product", label: "Product" },
  { key: "customer", label: "Customer" },
  { key: "rootCause", label: "Root Cause" },
  { key: "correctiveAction", label: "Corrective Action" },
  { key: "lessonsLearned", label: "Lessons Learned" },
  { key: "prevention", label: "Prevention" },
  { key: "validation", label: "Validation" },
];

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function joinValues(values: Array<unknown>) {
  const parts = values.map(stringValue).filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join("\n") : null;
}

function normalizeData(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getSnippet(label: string, value: string, query: string) {
  const lower = value.toLowerCase();
  const index = lower.indexOf(query);
  if (index < 0) return null;
  const start = Math.max(0, index - 45);
  const end = Math.min(value.length, index + query.length + 85);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < value.length ? "..." : "";
  return `${label} matched: ${prefix}${value.slice(start, end)}${suffix}`;
}

export function normalizeKnowledgeFilter(value: unknown): KnowledgeFilter {
  return typeof value === "string" && (KNOWLEDGE_FILTERS as string[]).includes(value)
    ? value as KnowledgeFilter
    : "all";
}

export function normalizeKnowledgeReportTypeFilter(value: unknown): KnowledgeReportTypeFilter {
  return typeof value === "string" && (KNOWLEDGE_REPORT_TYPE_FILTERS as string[]).includes(value)
    ? value as KnowledgeReportTypeFilter
    : "all";
}

export function normalizeKnowledgePriorityFilter(value: unknown): KnowledgePriorityFilter {
  return typeof value === "string" && (KNOWLEDGE_PRIORITY_FILTERS as string[]).includes(value)
    ? value as KnowledgePriorityFilter
    : "all";
}

export function normalizeKnowledgeLimit(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return KNOWLEDGE_SEARCH_LIMIT;
  return Math.min(KNOWLEDGE_SEARCH_LIMIT, Math.max(1, Math.floor(numeric)));
}

export function normalizeKnowledgeQuery(value: unknown) {
  return (typeof value === "string" ? value : "").trim().slice(0, 120);
}

export function isKnowledgeWorkflowStatus(value: unknown): value is KnowledgeWorkflowStatus {
  return typeof value === "string" && (KNOWLEDGE_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function getKnowledgeTrustLabel(report: { status?: string | null; workflowStatus?: string | null }) {
  if (report.workflowStatus === "approved") return "Approved";
  if (report.workflowStatus === "submitted") return "Submitted";
  if (report.workflowStatus === "closed") return "Closed";
  if (report.status === "completed") return "Completed";
  return "Completed";
}

export function isKnowledgeEligibleReport(report: { status?: string | null; workflowStatus?: string | null }) {
  if (report.status === "draft" || report.status === "in_progress") return false;
  if (report.workflowStatus === "internal_review") return false;
  return report.status === "completed" || isKnowledgeWorkflowStatus(report.workflowStatus);
}

export function reportMatchesKnowledgeFilter(
  report: Pick<ReportLike, "status" | "workflowStatus">,
  filter: KnowledgeFilter,
) {
  if (filter === "all") return true;
  if (filter === "completed") return report.status === "completed";
  return report.workflowStatus === filter;
}

export function reportMatchesKnowledgeFacets(
  report: Pick<ReportLike, "status" | "workflowStatus" | "reportType" | "priority">,
  input: {
    filter: KnowledgeFilter;
    reportType: KnowledgeReportTypeFilter;
    priority: KnowledgePriorityFilter;
  },
) {
  if (!reportMatchesKnowledgeFilter(report, input.filter)) return false;
  if (input.reportType !== "all" && report.reportType !== input.reportType) return false;
  if (input.priority !== "all" && report.priority !== input.priority) return false;
  return true;
}

export function buildKnowledgeEntry(report: ReportLike): KnowledgeEntry {
  const data = normalizeData(report.data);
  return {
    id: report.id,
    title: report.title,
    reportNumber: stringValue(data.reportNumber),
    status: report.status,
    workflowStatus: report.workflowStatus,
    trustLabel: getKnowledgeTrustLabel(report),
    revision: report.revision,
    lockedAt: report.lockedAt,
    reportType: report.reportType,
    priority: report.priority,
    source: report.source,
    problem: stringValue(data.problemDescription),
    product: stringValue(data.productName),
    customer: stringValue(data.customerName),
    rootCause: joinValues([
      data.confirmedRootCause,
      data.rootCauseOccurrence,
      data.rootCauseEscape,
      data.rootCauseSystem,
      data.why1,
      data.why2,
      data.why3,
      data.why4,
      data.why5,
    ]),
    correctiveAction: joinValues([
      data.selectedCorrectiveAction,
      data.correctiveRationale,
      data.implementationPlan,
    ]),
    lessonsLearned: stringValue(data.lessonsLearned),
    prevention: joinValues([
      data.systemChanges,
      data.processUpdates,
      data.horizontalDeployment,
      data.trainingNeeds,
    ]),
    validation: joinValues([
      data.testingResults,
      data.validationMethod,
      data.validationResults,
    ]),
    matchSnippet: null,
    matchedField: null,
    updatedAt: report.updatedAt,
    createdAt: report.createdAt,
  };
}

export function searchKnowledgeEntries(
  reportsToSearch: ReportLike[],
  input: {
    query?: string | null;
    filter?: KnowledgeFilter;
    reportType?: KnowledgeReportTypeFilter;
    priority?: KnowledgePriorityFilter;
    limit?: number;
  },
) {
  const query = (input.query || "").trim().toLowerCase();
  const filter = input.filter || "all";
  const reportType = input.reportType || "all";
  const priority = input.priority || "all";
  const limit = input.limit || KNOWLEDGE_SEARCH_LIMIT;

  return reportsToSearch
    .filter(isKnowledgeEligibleReport)
    .filter((report) => reportMatchesKnowledgeFacets(report, { filter, reportType, priority }))
    .map(buildKnowledgeEntry)
    .map((entry) => {
      if (query.length < 2) return entry;
      for (const field of SEARCH_FIELDS) {
        const value = entry[field.key];
        if (typeof value !== "string") continue;
        const snippet = getSnippet(field.label, value, query);
        if (snippet) return { ...entry, matchSnippet: snippet, matchedField: field.key };
      }
      return null;
    })
    .filter((entry): entry is KnowledgeEntry => entry !== null)
    .slice(0, limit);
}
