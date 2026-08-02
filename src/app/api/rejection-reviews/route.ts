import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { getForwardedIp } from "@/lib/p0-plus/tokens";
import { classifyReviewActor } from "@/lib/rejection-review/event-policy";
import { extractReviewSubmission, REJECTION_REVIEW_MAX_FILE_BYTES, RejectionReviewInputError } from "@/lib/rejection-review/files";
import { hashReviewSession, recordRejectionReviewEvent } from "@/lib/rejection-review/funnel";
import { createRejectionReviewTask, enforceRejectionReviewRateLimit, RejectionReviewRateLimitError } from "@/lib/rejection-review/service";
import { getRejectionReviewProviderMode } from "@/lib/rejection-review/payment-policy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > REJECTION_REVIEW_MAX_FILE_BYTES + 256_000) {
    return NextResponse.json({ error: "The submission is too large.", code: "body_too_large" }, { status: 413 });
  }
  const startedAt = new Date();
  let anonymousSessionId = "";
  let anonymousSessionHash = "";
  let trafficSource: unknown = "direct";
  let pastedText: unknown;
  let file: unknown;
  try {
    if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
      const form = await req.formData();
      anonymousSessionId = String(form.get("anonymousSessionId") || "").slice(0, 120);
      trafficSource = form.get("trafficSource");
      pastedText = form.get("reportText");
      file = form.get("file");
    } else {
      const body = await req.json().catch(() => ({}));
      anonymousSessionId = typeof body.anonymousSessionId === "string" ? body.anonymousSessionId.slice(0, 120) : "";
      trafficSource = body.trafficSource;
      pastedText = body.reportText;
    }
    const ip = getForwardedIp(req.headers);
    anonymousSessionHash = hashReviewSession(
      anonymousSessionId.length >= 16 ? `browser:${anonymousSessionId}` : `ip:${ip}`,
    );
    const submission = await extractReviewSubmission({ pastedText, file });
    await enforceRejectionReviewRateLimit(anonymousSessionHash);
    const user = await getSessionUser();
    const analysisStartedAt = new Date();
    const created = await createRejectionReviewTask({
      ...submission,
      anonymousSessionHash,
      trafficSource,
      userId: user?.id || null,
    });
    const actorKind = user
      ? classifyReviewActor({ email: user.email, providerMode: getRejectionReviewProviderMode() })
      : "anonymous";
    await recordRejectionReviewEvent({
      eventName: "review_upload_completed",
      anonymousSessionHash,
      actorKind,
      trafficSource: created.task.trafficSource,
      userId: user?.id || null,
      taskId: created.task.id,
      metadata: { sourceType: submission.sourceType, resultStatus: created.freeResult.status },
      durationMs: Date.now() - startedAt.getTime(),
      dedupeKey: `review_upload_completed:${created.task.id}`,
      createdAt: analysisStartedAt,
    });
    return NextResponse.json({
      token: created.token,
      redirectPath: `/8d-report-review-service/review/${encodeURIComponent(created.token)}`,
      expiresAt: created.task.expiresAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    const failureType = error instanceof RejectionReviewInputError
      ? error.code
      : error instanceof RejectionReviewRateLimitError
        ? "rate_limited"
        : "review_creation_failed";
    if (anonymousSessionHash) {
      await recordRejectionReviewEvent({
        eventName: "review_upload_started",
        anonymousSessionHash,
        actorKind: "anonymous",
        trafficSource,
        failureType,
        durationMs: Date.now() - startedAt.getTime(),
        dedupeKey: `review_upload_started:${anonymousSessionHash}:failure:${failureType}:${Date.now()}`,
      });
    }
    if (error instanceof RejectionReviewInputError) {
      return NextResponse.json({ error: error.message, code: error.code }, {
        status: error.code === "file_too_large" || error.code === "input_too_long" || error.code === "extracted_text_too_large" ? 413 : 400,
      });
    }
    if (error instanceof RejectionReviewRateLimitError) {
      return NextResponse.json({ error: error.message, code: "rate_limited" }, { status: 429 });
    }
    console.error("Rejection Review creation failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "The review could not be created. Please try again.", code: "review_creation_failed" }, { status: 503 });
  }
}
