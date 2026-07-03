import {
  isP0PlusPreviewEnabled,
  normalizeP0PlusOutputLanguage,
  P0_PLUS_PREVIEW_MAX_BODY_BYTES,
  P0_PLUS_PREVIEW_MAX_INPUT_CHARS,
  P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS,
  P0_PLUS_PREVIEW_RAW_INPUT_STORAGE_CHARS,
  P0_PLUS_PREVIEW_TTL_MS,
} from "@/lib/p0-plus/config";
import { p0PlusPreviewAiClient, P0PlusPreviewAiError, type P0PlusPreviewAiClient } from "@/lib/p0-plus/ai";
import { p0PlusRateLimiter, type P0PlusRateLimiter } from "@/lib/p0-plus/rate-limit";
import {
  p0PlusPreviewStorage,
  type CreateP0PlusPreviewInput,
  type P0PlusPreviewRecord,
  type P0PlusPreviewStorage,
} from "@/lib/p0-plus/storage";
import { createPreviewToken, hashPreviewLimiterKey, hashPreviewToken } from "@/lib/p0-plus/tokens";
import { validateP0PlusPreviewResponse, type P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import { mapP0PlusPreviewToReportDataPatch } from "@/lib/p0-plus/mapper";

export interface CreateP0PlusPreviewRequest {
  body: unknown;
  bodyBytes?: number | null;
  clientIp: string;
  browserToken?: string | null;
  now?: Date;
  enabled?: boolean;
}

export interface GetP0PlusPreviewRequest {
  token: string;
  now?: Date;
  enabled?: boolean;
}

export interface P0PlusPreviewServiceDependencies {
  aiClient?: P0PlusPreviewAiClient;
  storage?: P0PlusPreviewStorage;
  rateLimiter?: P0PlusRateLimiter;
  createToken?: () => string;
}

export interface P0PlusPreviewServiceResult {
  status: number;
  body: Record<string, unknown>;
}

function disabledResponse(): P0PlusPreviewServiceResult {
  return {
    status: 404,
    body: {
      error: "P0+ preview is not enabled",
      code: "p0_plus_preview_disabled",
    },
  };
}

function safeNotFoundResponse(code = "p0_plus_preview_not_found"): P0PlusPreviewServiceResult {
  return { status: 404, body: { error: "Preview not found", code } };
}

function parseBody(body: unknown) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { rawInput: "", outputLanguage: "en" };
  }
  const record = body as Record<string, unknown>;
  const rawInput = typeof record.rawInput === "string"
    ? record.rawInput
    : typeof record.input === "string"
      ? record.input
      : "";
  return {
    rawInput,
    outputLanguage: normalizeP0PlusOutputLanguage(record.outputLanguage),
  };
}

function inputValidationError(rawInput: string, bodyBytes?: number | null): P0PlusPreviewServiceResult | null {
  if (bodyBytes !== undefined && bodyBytes !== null && bodyBytes > P0_PLUS_PREVIEW_MAX_BODY_BYTES) {
    return { status: 413, body: { error: "Preview input is too large", code: "body_too_large" } };
  }
  if (rawInput.length > P0_PLUS_PREVIEW_MAX_INPUT_CHARS) {
    return { status: 413, body: { error: "Preview input is too large", code: "input_too_long" } };
  }
  const visibleLength = rawInput.replace(/\s+/g, "").length;
  if (visibleLength < P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS) {
    return { status: 400, body: { error: "Preview input needs more detail", code: "input_too_short" } };
  }
  return null;
}

function readOnlyPreviewBody(record: P0PlusPreviewRecord) {
  return {
    tokenExpiresAt: record.expiresAt.toISOString(),
    outputLanguage: record.outputLanguage,
    preview: record.previewPayloadJson,
  };
}

export async function createP0PlusPreview(
  request: CreateP0PlusPreviewRequest,
  dependencies: P0PlusPreviewServiceDependencies = {},
): Promise<P0PlusPreviewServiceResult> {
  const enabled = request.enabled ?? isP0PlusPreviewEnabled();
  if (!enabled) return disabledResponse();

  const { rawInput, outputLanguage } = parseBody(request.body);
  const inputError = inputValidationError(rawInput, request.bodyBytes);
  if (inputError) return inputError;

  const ipKey = hashPreviewLimiterKey(`ip:${request.clientIp || "unknown"}`);
  const browserTokenHash = request.browserToken ? hashPreviewLimiterKey(`browser:${request.browserToken}`) : null;
  const limiter = dependencies.rateLimiter || p0PlusRateLimiter;
  const rateDecision = limiter.check({
    ipKey,
    browserKey: browserTokenHash,
    bodyBytes: request.bodyBytes,
    visibleText: rawInput,
  });

  if (!rateDecision.allowed) {
    const status = rateDecision.reason === "rate_limited" ? 429 : rateDecision.reason === "input_too_short" ? 400 : 413;
    return {
      status,
      body: {
        error: "Preview request cannot be processed",
        code: rateDecision.reason,
      },
    };
  }

  const aiClient = dependencies.aiClient || p0PlusPreviewAiClient;
  let preview: P0PlusPreviewResponse;
  try {
    preview = await aiClient.generatePreview({ rawInput, outputLanguage });
  } catch (error) {
    if (!(error instanceof P0PlusPreviewAiError)) {
      console.error("Unexpected P0+ preview AI error", { error });
    }
    return {
      status: 502,
      body: {
        error: "Preview could not be generated",
        code: "preview_generation_failed",
      },
    };
  }

  const validation = validateP0PlusPreviewResponse(preview);
  if (!validation.success || !validation.data) {
    return {
      status: 502,
      body: {
        error: "Preview could not be generated",
        code: "preview_schema_invalid",
      },
    };
  }

  const sanitizedPatch = mapP0PlusPreviewToReportDataPatch(validation.data).patch;
  const sanitizedPreview: P0PlusPreviewResponse = {
    ...validation.data,
    conversion: {
      ...validation.data.conversion,
      reportDataPatch: sanitizedPatch,
    },
  };

  const token = dependencies.createToken?.() || createPreviewToken();
  const tokenHash = hashPreviewToken(token);
  const now = request.now || new Date();
  const storageInput: CreateP0PlusPreviewInput = {
    tokenHash,
    boundedRawInput: rawInput.slice(0, P0_PLUS_PREVIEW_RAW_INPUT_STORAGE_CHARS),
    outputLanguage,
    previewPayloadJson: sanitizedPreview,
    clientIpHash: ipKey,
    browserTokenHash,
    expiresAt: new Date(now.getTime() + P0_PLUS_PREVIEW_TTL_MS),
  };

  const storage = dependencies.storage || p0PlusPreviewStorage;
  const record = await storage.create(storageInput);

  return {
    status: 201,
    body: {
      token,
      ...readOnlyPreviewBody(record),
    },
  };
}

export async function getP0PlusPreview(
  request: GetP0PlusPreviewRequest,
  dependencies: P0PlusPreviewServiceDependencies = {},
): Promise<P0PlusPreviewServiceResult> {
  const enabled = request.enabled ?? isP0PlusPreviewEnabled();
  if (!enabled) return disabledResponse();

  if (!request.token || request.token.length < 20) return safeNotFoundResponse();

  const storage = dependencies.storage || p0PlusPreviewStorage;
  const record = await storage.findActiveByTokenHash(hashPreviewToken(request.token), request.now || new Date());
  if (!record) return safeNotFoundResponse("p0_plus_preview_expired_or_not_found");

  return { status: 200, body: readOnlyPreviewBody(record) };
}
