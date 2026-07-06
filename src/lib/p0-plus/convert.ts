import { randomUUID } from "crypto";
import { isP0PlusPreviewEnabled } from "@/lib/p0-plus/config";
import { mapP0PlusPreviewToReportDataPatch } from "@/lib/p0-plus/mapper";
import { hashPreviewToken } from "@/lib/p0-plus/tokens";
import { validateP0PlusPreviewResponse, type P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import {
  p0PlusPreviewStorage,
  type P0PlusPreviewConversionStorage,
  type P0PlusPreviewRecord,
} from "@/lib/p0-plus/storage";
import { getAccessibleReport } from "@/lib/report-access";
import {
  createReportFromData,
  normalizeReportPriority,
  normalizeReportType,
  type CreateReportFromDataInput,
  type CreateReportFromDataResult,
  type ReportCreationUser,
} from "@/lib/report-creation";
import type { ReportData } from "@/lib/report-steps";

const FALLBACK_P0_PLUS_REPORT_TITLE = "AI-generated 8D draft";

export interface P0PlusConversionDependencies {
  storage?: P0PlusPreviewConversionStorage;
  createReport?: (input: CreateReportFromDataInput) => Promise<CreateReportFromDataResult>;
  getAccessibleReport?: (reportId: string, userId: string) => Promise<{ id: string } | null>;
  createClaimToken?: () => string;
}

export interface P0PlusConversionRequest {
  token: string;
  user: ReportCreationUser | null;
  now?: Date;
  enabled?: boolean;
}

export type P0PlusConversionResult = {
  status: number;
  body: Record<string, unknown>;
};

export type P0PlusContinuationState =
  | {
      kind: "active";
      title: string;
      summary: string;
      expiresAt: Date;
      outputLanguage: string;
      preview: P0PlusPreviewResponse;
    }
  | {
      kind: "already_converted";
      reportId: string;
      redirectPath: string;
      title: string;
      summary: string;
      expiresAt: Date;
      outputLanguage: string;
      preview: P0PlusPreviewResponse;
    }
  | {
      kind: "unavailable";
      code: string;
      message: string;
    };

function disabledResponse(): P0PlusConversionResult {
  return {
    status: 404,
    body: {
      error: "P0+ preview conversion is not enabled",
      code: "p0_plus_preview_disabled",
    },
  };
}

function unauthorizedResponse(): P0PlusConversionResult {
  return {
    status: 401,
    body: {
      error: "Sign in required",
      code: "p0_plus_auth_required",
    },
  };
}

function safeNotFoundResponse(code = "p0_plus_preview_expired_or_not_found"): P0PlusConversionResult {
  return {
    status: 404,
    body: {
      error: "Preview not found",
      code,
    },
  };
}

function conversionInProgressResponse(): P0PlusConversionResult {
  return {
    status: 409,
    body: {
      error: "Preview conversion is already in progress. Try again in a moment.",
      code: "p0_plus_conversion_in_progress",
    },
  };
}

function conversionStatusUnknownResponse(): P0PlusConversionResult {
  return {
    status: 409,
    body: {
      error: "Preview conversion status could not be confirmed. Try again in a moment.",
      code: "p0_plus_conversion_status_unknown",
    },
  };
}

function safeUnavailableState(code = "p0_plus_preview_expired_or_not_found"): P0PlusContinuationState {
  return {
    kind: "unavailable",
    code,
    message: "This preview is no longer available. Generate a new preview to continue.",
  };
}

function sanitizeReportTitle(value: unknown) {
  if (typeof value !== "string") return FALLBACK_P0_PLUS_REPORT_TITLE;
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return normalized.slice(0, 120) || FALLBACK_P0_PLUS_REPORT_TITLE;
}

function isValidToken(token: string) {
  return Boolean(token) && token.length >= 20;
}

function validateRecordPreview(record: P0PlusPreviewRecord) {
  const validation = validateP0PlusPreviewResponse(record.previewPayloadJson);
  return validation.success && validation.data ? validation.data : null;
}

function previewSummary(preview: P0PlusPreviewResponse) {
  return preview.inputSummary.caseSummary || "No relevant data";
}

function reportRedirectPath(reportId: string) {
  return `/reports/${reportId}`;
}

function createDefaultClaimToken() {
  return randomUUID();
}

async function resolveConvertedReport(
  record: P0PlusPreviewRecord,
  userId: string,
  dependencies: P0PlusConversionDependencies,
) {
  if (!record.convertedReportId) return null;
  const access = await (dependencies.getAccessibleReport || getAccessibleReport)(record.convertedReportId, userId);
  if (!access) return { allowed: false as const };
  return {
    allowed: true as const,
    reportId: record.convertedReportId,
    redirectPath: reportRedirectPath(record.convertedReportId),
  };
}

export async function getP0PlusContinuationState(
  request: Omit<P0PlusConversionRequest, "user"> & { userId: string },
  dependencies: P0PlusConversionDependencies = {},
): Promise<P0PlusContinuationState> {
  const enabled = request.enabled ?? isP0PlusPreviewEnabled();
  if (!enabled) return safeUnavailableState("p0_plus_preview_disabled");
  if (!isValidToken(request.token)) return safeUnavailableState();

  const storage = dependencies.storage || p0PlusPreviewStorage;
  const record = await storage.findActiveByTokenHash(hashPreviewToken(request.token), request.now || new Date());
  if (!record) return safeUnavailableState();

  const preview = validateRecordPreview(record);
  if (!preview) return safeUnavailableState("p0_plus_preview_invalid");

  const title = sanitizeReportTitle(preview.conversion.recommendedReportTitle);
  const summary = previewSummary(preview);
  const converted = await resolveConvertedReport(record, request.userId, dependencies);
  if (converted && !converted.allowed) return safeUnavailableState();
  if (converted?.allowed) {
    return {
      kind: "already_converted",
      reportId: converted.reportId,
      redirectPath: converted.redirectPath,
      title,
      summary,
      expiresAt: record.expiresAt,
      outputLanguage: record.outputLanguage,
      preview,
    };
  }

  return {
    kind: "active",
    title,
    summary,
    expiresAt: record.expiresAt,
    outputLanguage: record.outputLanguage,
    preview,
  };
}

export async function convertP0PlusPreviewToReport(
  request: P0PlusConversionRequest,
  dependencies: P0PlusConversionDependencies = {},
): Promise<P0PlusConversionResult> {
  const enabled = request.enabled ?? isP0PlusPreviewEnabled();
  if (!enabled) return disabledResponse();
  if (!request.user) return unauthorizedResponse();
  if (!isValidToken(request.token)) return safeNotFoundResponse();

  const storage = dependencies.storage || p0PlusPreviewStorage;
  const now = request.now || new Date();
  const record = await storage.findActiveByTokenHash(hashPreviewToken(request.token), now);
  if (!record) return safeNotFoundResponse();

  const converted = await resolveConvertedReport(record, request.user.id, dependencies);
  if (converted && !converted.allowed) return safeNotFoundResponse();
  if (converted?.allowed) {
    return {
      status: 200,
      body: {
        reportId: converted.reportId,
        redirectPath: converted.redirectPath,
        reused: true,
      },
    };
  }

  const claimToken = (dependencies.createClaimToken || createDefaultClaimToken)();
  const claimed = await storage.claimConversion(record.id, claimToken, now);
  if (!claimed) {
    const latest = await storage.findActiveByTokenHash(hashPreviewToken(request.token), now);
    if (!latest) return safeNotFoundResponse();

    const latestConverted = await resolveConvertedReport(latest, request.user.id, dependencies);
    if (latestConverted && !latestConverted.allowed) return safeNotFoundResponse();
    if (latestConverted?.allowed) {
      return {
        status: 200,
        body: {
          reportId: latestConverted.reportId,
          redirectPath: latestConverted.redirectPath,
          reused: true,
        },
      };
    }

    return conversionInProgressResponse();
  }

  const preview = validateRecordPreview(record);
  if (!preview) {
    await storage.clearConversionClaim(record.id, claimToken, now);
    return safeNotFoundResponse("p0_plus_preview_invalid");
  }

  const mapped = mapP0PlusPreviewToReportDataPatch(preview);
  if (mapped.issues.length > 0) {
    console.warn("P0+ preview conversion mapper issues", {
      previewId: record.id,
      issues: mapped.issues,
    });
  }

  const safeDataPatch: Partial<ReportData> = { ...mapped.patch };
  const reportType = normalizeReportType(safeDataPatch.reportType);
  const priority = normalizeReportPriority(safeDataPatch.priority);
  if (safeDataPatch.reportType !== reportType) delete safeDataPatch.reportType;
  if (safeDataPatch.priority !== priority) delete safeDataPatch.priority;

  const createReport = dependencies.createReport || createReportFromData;
  let created: CreateReportFromDataResult;
  try {
    created = await createReport({
      user: request.user,
      title: sanitizeReportTitle(preview.conversion.recommendedReportTitle),
      reportType,
      priority,
      source: "p0_plus_preview",
      data: safeDataPatch,
      status: "draft",
    });
  } catch (error) {
    await storage.clearConversionClaim(record.id, claimToken, now);
    console.error("P0+ preview conversion report creation failed", { previewId: record.id, error });
    return {
      status: 500,
      body: {
        error: "Report could not be created",
        code: "p0_plus_report_creation_failed",
      },
    };
  }

  if (!created.ok) {
    await storage.clearConversionClaim(record.id, claimToken, now);
    return {
      status: created.status,
      body: {
        ...created.body,
        code: "p0_plus_report_creation_failed",
      },
    };
  }

  const marked = await storage.markConverted(record.id, created.report.id, claimToken, now);
  if (!marked) {
    const latest = await storage.findActiveByTokenHash(hashPreviewToken(request.token), now);
    const latestConverted = latest ? await resolveConvertedReport(latest, request.user.id, dependencies) : null;
    if (latestConverted?.allowed) {
      return {
        status: 200,
        body: {
          reportId: latestConverted.reportId,
          redirectPath: latestConverted.redirectPath,
          reused: true,
        },
      };
    }
    console.warn("P0+ preview conversion could not mark preview as converted", {
      previewId: record.id,
    });
    return conversionStatusUnknownResponse();
  }

  return {
    status: 201,
    body: {
      reportId: created.report.id,
      redirectPath: reportRedirectPath(created.report.id),
    },
  };
}
