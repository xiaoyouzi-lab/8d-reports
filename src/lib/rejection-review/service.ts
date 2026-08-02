import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { rejectionReviewTasks } from "@/lib/db/schema";
import { runDeterministicRejectionReview } from "@/lib/rejection-review/rules";
import { toFreeRejectionRiskPreview, type FreeRejectionRiskPreview, type RejectionRiskReview } from "@/lib/rejection-review/schema";
import { normalizeReviewTrafficSource } from "@/lib/rejection-review/event-policy";

const REVIEW_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class RejectionReviewRateLimitError extends Error {
  constructor() {
    super("Too many reviews were started. Please try again later.");
    this.name = "RejectionReviewRateLimitError";
  }
}

export async function enforceRejectionReviewRateLimit(anonymousSessionHash: string, now = new Date()) {
  const [burst, daily] = await Promise.all([
    db.select({ value: count() }).from(rejectionReviewTasks).where(and(
      eq(rejectionReviewTasks.anonymousSessionHash, anonymousSessionHash),
      gte(rejectionReviewTasks.createdAt, new Date(now.getTime() - 5 * 60 * 1000)),
    )),
    db.select({ value: count() }).from(rejectionReviewTasks).where(and(
      eq(rejectionReviewTasks.anonymousSessionHash, anonymousSessionHash),
      gte(rejectionReviewTasks.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    )),
  ]);
  if ((burst[0]?.value || 0) >= 3 || (daily[0]?.value || 0) >= 10) {
    throw new RejectionReviewRateLimitError();
  }
}

function createReviewToken() {
  return randomBytes(32).toString("base64url");
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createRejectionReviewTask(input: {
  text: string;
  sourceType: "paste" | "txt" | "docx";
  sourceFilename?: string | null;
  anonymousSessionHash: string;
  trafficSource: unknown;
  userId?: string | null;
  now?: Date;
}) {
  const now = input.now || new Date();
  const token = createReviewToken();
  const fullResult = runDeterministicRejectionReview(input.text);
  const freeResult = toFreeRejectionRiskPreview(fullResult);
  const [task] = await db.insert(rejectionReviewTasks).values({
    tokenHash: hashToken(token),
    userId: input.userId || null,
    anonymousSessionHash: input.anonymousSessionHash,
    trafficSource: normalizeReviewTrafficSource(input.trafficSource),
    sourceType: input.sourceType,
    sourceFilename: input.sourceFilename || null,
    inputText: input.text,
    inputHash: createHash("sha256").update(input.text).digest("hex"),
    status: "full_ready",
    freeResultJson: freeResult,
    fullResultJson: fullResult,
    aiPolicyOutcome: "rules_only",
    expiresAt: new Date(now.getTime() + REVIEW_TOKEN_TTL_MS),
  }).returning({
    id: rejectionReviewTasks.id,
    sourceType: rejectionReviewTasks.sourceType,
    trafficSource: rejectionReviewTasks.trafficSource,
    expiresAt: rejectionReviewTasks.expiresAt,
  });
  return { token, task, freeResult };
}

export async function getRejectionReviewTaskByToken(token: string) {
  if (!token || token.length < 30) return null;
  const [task] = await db.select({
    id: rejectionReviewTasks.id,
    userId: rejectionReviewTasks.userId,
    anonymousSessionHash: rejectionReviewTasks.anonymousSessionHash,
    trafficSource: rejectionReviewTasks.trafficSource,
    sourceType: rejectionReviewTasks.sourceType,
    status: rejectionReviewTasks.status,
    freeResultJson: rejectionReviewTasks.freeResultJson,
    fullResultJson: rejectionReviewTasks.fullResultJson,
    expiresAt: rejectionReviewTasks.expiresAt,
    createdAt: rejectionReviewTasks.createdAt,
  }).from(rejectionReviewTasks).where(and(
    eq(rejectionReviewTasks.tokenHash, hashToken(token)),
    gt(rejectionReviewTasks.expiresAt, new Date()),
  )).limit(1);
  if (!task) return null;
  return {
    ...task,
    freeResultJson: task.freeResultJson as FreeRejectionRiskPreview,
    fullResultJson: task.fullResultJson as RejectionRiskReview,
  };
}
