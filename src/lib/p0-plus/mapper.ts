import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";
import {
  P0_PLUS_DRAFT_FIELD_NAMES,
  type P0PlusDraftStepId,
  type P0PlusPreviewResponse,
  type P0PlusSourceStatus,
} from "@/lib/p0-plus/schema";

export interface P0PlusMapperIssue {
  field: string;
  reason:
    | "unknown_report_data_key"
    | "unsafe_report_data_key"
    | "unverified_source_status"
    | "missing_source_status"
    | "invalid_value";
}

export interface P0PlusReportDataPatchResult {
  patch: Partial<ReportData>;
  issues: P0PlusMapperIssue[];
}

const ALL_REPORT_DATA_KEYS = new Set(Object.keys(DEFAULT_REPORT_DATA));

const UNSAFE_REPORT_DATA_KEYS = new Set([
  "reportNumber",
  "preparedSignatureId",
  "preparedSignatureUrl",
  "reviewedSignatureId",
  "reviewedSignatureUrl",
  "approverName",
  "approverDate",
  "approvedSignatureId",
  "approvedSignatureUrl",
]);

const SAFE_REPORT_DATA_KEYS = new Set(
  Object.keys(DEFAULT_REPORT_DATA).filter((key) => !UNSAFE_REPORT_DATA_KEYS.has(key)),
);

const VERIFIED_SOURCE_STATUSES = new Set<P0PlusSourceStatus>(["provided", "extracted"]);

function isReportDataKey(key: string): key is keyof ReportData {
  return ALL_REPORT_DATA_KEYS.has(key);
}

function isSafeReportDataKey(key: string): key is keyof ReportData {
  return SAFE_REPORT_DATA_KEYS.has(key);
}

export function getPreviewDraftSourceStatuses(preview: P0PlusPreviewResponse) {
  const statuses = new Map<keyof ReportData, P0PlusSourceStatus>();
  statuses.set("reportType", preview.draft.reportType.sourceStatus);
  statuses.set("priority", preview.draft.priority.sourceStatus);

  for (const [stepId, fieldNames] of Object.entries(P0_PLUS_DRAFT_FIELD_NAMES) as Array<
    [P0PlusDraftStepId, readonly string[]]
  >) {
    const step = preview.draft[stepId] as Record<string, { sourceStatus: P0PlusSourceStatus }>;
    for (const fieldName of fieldNames) {
      if (isReportDataKey(fieldName)) {
        statuses.set(fieldName, step[fieldName].sourceStatus);
      }
    }
  }

  return statuses;
}

export function mapP0PlusPreviewToReportDataPatch(preview: P0PlusPreviewResponse): P0PlusReportDataPatchResult {
  const sourceStatuses = getPreviewDraftSourceStatuses(preview);
  const patch: Partial<ReportData> = {};
  const issues: P0PlusMapperIssue[] = [];

  for (const [rawKey, value] of Object.entries(preview.conversion.reportDataPatch)) {
    if (!isReportDataKey(rawKey)) {
      issues.push({ field: rawKey, reason: "unknown_report_data_key" });
      continue;
    }
    if (!isSafeReportDataKey(rawKey)) {
      issues.push({ field: rawKey, reason: "unsafe_report_data_key" });
      continue;
    }
    if (typeof value !== "string") {
      issues.push({ field: rawKey, reason: "invalid_value" });
      continue;
    }

    const sourceStatus = sourceStatuses.get(rawKey);
    if (!sourceStatus) {
      issues.push({ field: rawKey, reason: "missing_source_status" });
      continue;
    }
    if (!VERIFIED_SOURCE_STATUSES.has(sourceStatus)) {
      issues.push({ field: rawKey, reason: "unverified_source_status" });
      continue;
    }

    patch[rawKey] = value;
  }

  return { patch, issues };
}
