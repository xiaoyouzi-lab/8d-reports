import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { classifyReviewActor, isRejectionReviewFunnelEvent, normalizeReviewTrafficSource } from "@/lib/rejection-review/event-policy";
import { hashReviewSession, recordRejectionReviewEvent } from "@/lib/rejection-review/funnel";
import { getRejectionReviewTaskByToken } from "@/lib/rejection-review/service";
import { getRejectionReviewProviderMode } from "@/lib/rejection-review/payment-policy";

const PUBLIC_EVENTS = new Set(["qualified_landing_view", "review_upload_started", "review_free_result_viewed"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const eventName = body?.eventName;
  if (!isRejectionReviewFunnelEvent(eventName) || !PUBLIC_EVENTS.has(eventName)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const anonymousSessionId = typeof body.anonymousSessionId === "string"
    ? body.anonymousSessionId.trim().slice(0, 120)
    : "";
  if (anonymousSessionId.length < 16) {
    return NextResponse.json({ error: "Anonymous session is required" }, { status: 400 });
  }
  const sessionHash = hashReviewSession(`browser:${anonymousSessionId}`);
  const user = await getSessionUser();
  let taskId: string | null = null;
  let trafficSource = normalizeReviewTrafficSource(body.trafficSource);
  let authoritativeSessionHash = sessionHash;
  if (eventName === "review_free_result_viewed") {
    const task = typeof body.taskToken === "string"
      ? await getRejectionReviewTaskByToken(body.taskToken)
      : null;
    if (!task) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    taskId = task.id;
    trafficSource = task.trafficSource;
    authoritativeSessionHash = task.anonymousSessionHash;
  }
  const eventId = typeof body.eventId === "string" && /^[a-z0-9-]{16,80}$/i.test(body.eventId)
    ? body.eventId
    : `${eventName}:${new Date().toISOString().slice(0, 10)}`;
  const dedupeKey = eventName === "review_free_result_viewed" && taskId
    ? `review_free_result_viewed:${taskId}:${authoritativeSessionHash}`
    : `${eventName}:${authoritativeSessionHash}:${eventId}`;
  await recordRejectionReviewEvent({
    eventName,
    anonymousSessionHash: authoritativeSessionHash,
    actorKind: user ? classifyReviewActor({ email: user.email, providerMode: getRejectionReviewProviderMode() }) : "anonymous",
    trafficSource,
    userId: user?.id || null,
    taskId,
    metadata: { locale: body.locale === "zh-CN" ? "zh-CN" : "en" },
    dedupeKey,
  });
  return NextResponse.json({ success: true });
}
