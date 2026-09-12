import { randomUUID } from "node:crypto";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  p0PlusPreviews,
  qualityCaseEntitlements,
  qualityCasePurchases,
  qualityCases,
  users,
} from "@/lib/db/schema";
import { getCreemApiMode, type CreemApiMode } from "@/lib/creem";
import { FOUNDING_CASE_PRICE_CENTS } from "@/lib/plans";
import { hashPreviewToken } from "@/lib/p0-plus/tokens";
import { validateP0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import { createQualityCase } from "@/lib/quality-cases/service";
import { classifyRevenueActor, recordRevenueFunnelEvent } from "@/lib/revenue/funnel";

const CASE_CLAIM_TTL_MS = 10 * 60 * 1000;

function safeTitle(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)
    : "";
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

export function buildFoundingCaseData(input: {
  purchaseId: string;
  rawInput: string;
  previewPayload: unknown;
}) {
  const validation = validateP0PlusPreviewResponse(input.previewPayload);
  if (!validation.success || !validation.data) return null;
  const preview = validation.data;
  const reportData = preview.conversion.reportDataPatch as Record<string, unknown>;
  return {
    title: safeTitle(preview.conversion.recommendedReportTitle) || "Customer complaint investigation",
    priority: stringField(reportData.priority) || "medium",
    caseData: {
      foundingCasePurchaseId: input.purchaseId,
      source: "founding_case_preview",
      complaintSummary: preview.inputSummary.caseSummary || "No relevant data",
      originalComplaint: input.rawInput,
      customerName: stringField(reportData.customerName),
      productName: stringField(reportData.productName),
      reportData,
      readiness: {
        risk: preview.readiness_check.overall_risk,
        score: preview.readiness_check.score,
      },
    },
  };
}

export async function createOrReuseFoundingCasePurchase(input: {
  user: { id: string; email: string };
  previewToken: string;
  providerMode?: CreemApiMode;
}) {
  const now = new Date();
  const [preview] = await db
    .select()
    .from(p0PlusPreviews)
    .where(and(
      eq(p0PlusPreviews.tokenHash, hashPreviewToken(input.previewToken)),
      lte(sql`${now}`, p0PlusPreviews.expiresAt),
    ))
    .limit(1);
  if (!preview) return { ok: false as const, status: 404, error: "Preview not found or expired." };

  const [existing] = await db
    .select()
    .from(qualityCasePurchases)
    .where(eq(qualityCasePurchases.previewId, preview.id))
    .limit(1);
  if (existing) {
    if (existing.userId !== input.user.id) {
      return { ok: false as const, status: 404, error: "Preview not found or expired." };
    }
    return { ok: true as const, value: { purchase: existing, preview, reused: true } };
  }

  const purchaseId = randomUUID();
  const providerMode = input.providerMode || getCreemApiMode();
  const [created] = await db
    .insert(qualityCasePurchases)
    .values({
      id: purchaseId,
      userId: input.user.id,
      previewId: preview.id,
      providerRequestId: `founding-case-${purchaseId}`,
      providerMode,
      customerKind: classifyRevenueActor({ email: input.user.email, providerMode }),
      amountSubtotalCents: FOUNDING_CASE_PRICE_CENTS,
      currency: "USD",
    })
    .onConflictDoNothing({ target: qualityCasePurchases.previewId })
    .returning();
  if (created) return { ok: true as const, value: { purchase: created, preview, reused: false } };

  const [raced] = await db.select().from(qualityCasePurchases)
    .where(eq(qualityCasePurchases.previewId, preview.id)).limit(1);
  if (!raced || raced.userId !== input.user.id) {
    return { ok: false as const, status: 409, error: "Purchase could not be started." };
  }
  return { ok: true as const, value: { purchase: raced, preview, reused: true } };
}

export async function saveFoundingCaseCheckout(input: {
  purchaseId: string;
  providerCheckoutId: string;
  providerProductId: string;
  checkoutUrl: string;
}) {
  const [purchase] = await db.update(qualityCasePurchases).set({
    providerCheckoutId: input.providerCheckoutId,
    providerProductId: input.providerProductId,
    checkoutUrl: input.checkoutUrl,
    failureCode: null,
    updatedAt: new Date(),
  }).where(and(
    eq(qualityCasePurchases.id, input.purchaseId),
    eq(qualityCasePurchases.status, "pending"),
  )).returning();
  return purchase || null;
}

export async function markFoundingCaseCheckoutFailed(purchaseId: string, failureCode: string) {
  await db.update(qualityCasePurchases).set({
    status: "failed",
    failureCode: failureCode.slice(0, 80),
    updatedAt: new Date(),
  }).where(and(
    eq(qualityCasePurchases.id, purchaseId),
    eq(qualityCasePurchases.status, "pending"),
  ));
}

export async function restartFoundingCasePurchase(purchaseId: string) {
  const [purchase] = await db.update(qualityCasePurchases).set({
    status: "pending",
    failureCode: null,
    updatedAt: new Date(),
  }).where(and(
    eq(qualityCasePurchases.id, purchaseId),
    eq(qualityCasePurchases.status, "failed"),
  )).returning();
  return purchase || null;
}

export async function ensureFoundingCaseCreated(purchaseId: string) {
  const [row] = await db.select({
    purchase: qualityCasePurchases,
    preview: p0PlusPreviews,
    user: users,
  }).from(qualityCasePurchases)
    .innerJoin(p0PlusPreviews, eq(qualityCasePurchases.previewId, p0PlusPreviews.id))
    .innerJoin(users, eq(qualityCasePurchases.userId, users.id))
    .where(eq(qualityCasePurchases.id, purchaseId)).limit(1);
  if (!row || row.purchase.status !== "paid") return null;
  if (row.purchase.caseId) return row.purchase.caseId;

  const [recovered] = await db.select({ id: qualityCases.id }).from(qualityCases)
    .where(sql`${qualityCases.caseData} ->> 'foundingCasePurchaseId' = ${purchaseId}`).limit(1);
  if (recovered) {
    await linkFoundingCase(purchaseId, recovered.id);
    return recovered.id;
  }

  const claimToken = randomUUID();
  const now = new Date();
  const [claimed] = await db.update(qualityCasePurchases).set({
    caseCreationClaimToken: claimToken,
    caseCreationClaimExpiresAt: new Date(now.getTime() + CASE_CLAIM_TTL_MS),
    updatedAt: now,
  }).where(and(
    eq(qualityCasePurchases.id, purchaseId),
    eq(qualityCasePurchases.status, "paid"),
    isNull(qualityCasePurchases.caseId),
    or(
      isNull(qualityCasePurchases.caseCreationClaimToken),
      isNull(qualityCasePurchases.caseCreationClaimExpiresAt),
      lte(qualityCasePurchases.caseCreationClaimExpiresAt, now),
    ),
  )).returning();
  if (!claimed) return null;

  const mapped = buildFoundingCaseData({
    purchaseId,
    rawInput: row.preview.boundedRawInput,
    previewPayload: row.preview.previewPayloadJson,
  });
  if (!mapped) {
    await clearCaseClaim(purchaseId, claimToken);
    throw new Error("Paid preview has an invalid contract");
  }

  const created = await createQualityCase(
    { id: row.user.id, name: row.user.name },
    {
      title: mapped.title,
      coordinatorOrganization: "Internal quality team",
      outputType: "8d",
      priority: mapped.priority,
      caseData: mapped.caseData,
    },
  );
  if (!created.ok) {
    await clearCaseClaim(purchaseId, claimToken);
    throw new Error(`Quality Case creation failed (${created.status})`);
  }
  await linkFoundingCase(purchaseId, created.value.id, claimToken);
  await recordRevenueFunnelEvent({
    eventName: "case_created",
    funnelId: row.preview.browserTokenHash || row.preview.clientIpHash,
    userId: row.user.id,
    previewId: row.preview.id,
    purchaseId,
    caseId: created.value.id,
    actorKind: row.purchase.customerKind as "owner" | "test" | "external",
    dedupeKey: `case_created:${purchaseId}`,
  });
  return created.value.id;
}

async function clearCaseClaim(purchaseId: string, claimToken: string) {
  await db.update(qualityCasePurchases).set({
    caseCreationClaimToken: null,
    caseCreationClaimExpiresAt: null,
    updatedAt: new Date(),
  }).where(and(
    eq(qualityCasePurchases.id, purchaseId),
    eq(qualityCasePurchases.caseCreationClaimToken, claimToken),
  ));
}

async function linkFoundingCase(purchaseId: string, caseId: string, claimToken?: string) {
  const conditions = [eq(qualityCasePurchases.id, purchaseId), isNull(qualityCasePurchases.caseId)];
  if (claimToken) conditions.push(eq(qualityCasePurchases.caseCreationClaimToken, claimToken));
  const [purchase] = await db.update(qualityCasePurchases).set({
    caseId,
    caseCreationClaimToken: null,
    caseCreationClaimExpiresAt: null,
    updatedAt: new Date(),
  }).where(and(...conditions)).returning();
  if (!purchase?.caseId) {
    const [latest] = await db.select().from(qualityCasePurchases)
      .where(eq(qualityCasePurchases.id, purchaseId)).limit(1);
    if (latest?.caseId !== caseId) throw new Error("Purchase Case link conflict");
  }
  const previewId = purchase?.previewId || (await db.select({ previewId: qualityCasePurchases.previewId })
    .from(qualityCasePurchases)
    .where(eq(qualityCasePurchases.id, purchaseId))
    .limit(1))[0]?.previewId;
  if (!previewId) throw new Error("Purchase preview link is missing");
  await Promise.all([
    db.update(qualityCaseEntitlements).set({ caseId, updatedAt: new Date() })
      .where(eq(qualityCaseEntitlements.purchaseId, purchaseId)),
    db.update(p0PlusPreviews).set({ convertedCaseId: caseId, updatedAt: new Date() })
      .where(eq(p0PlusPreviews.id, previewId)),
  ]);
}

export async function activateFoundingCasePurchase(input: {
  purchaseId: string;
  userId: string;
  providerCheckoutId: string;
  providerTransactionId?: string | null;
  providerProductId: string;
  amountPaidCents: number;
  currency: string;
}) {
  const [purchase] = await db.select().from(qualityCasePurchases)
    .where(eq(qualityCasePurchases.id, input.purchaseId)).limit(1);
  if (!purchase || purchase.userId !== input.userId) throw new Error("Founding Case purchase mismatch");
  if (purchase.status === "refunded" || purchase.status === "cancelled") return null;
  if (input.providerProductId !== purchase.providerProductId) throw new Error("Founding Case product mismatch");
  if (input.currency.toUpperCase() !== "USD" || input.amountPaidCents !== FOUNDING_CASE_PRICE_CENTS) {
    throw new Error("Founding Case amount mismatch");
  }
  const now = new Date();
  const [paid] = await db.update(qualityCasePurchases).set({
    status: "paid",
    providerCheckoutId: input.providerCheckoutId,
    providerTransactionId: input.providerTransactionId || purchase.providerTransactionId,
    amountPaidCents: input.amountPaidCents,
    currency: input.currency.toUpperCase(),
    paidAt: purchase.paidAt || now,
    failureCode: null,
    updatedAt: now,
  }).where(eq(qualityCasePurchases.id, purchase.id)).returning();
  await db.insert(qualityCaseEntitlements).values({
    purchaseId: paid.id,
    userId: paid.userId,
    previewId: paid.previewId,
    caseId: paid.caseId,
    status: "active",
  }).onConflictDoNothing({ target: qualityCaseEntitlements.purchaseId });
  return ensureFoundingCaseCreated(paid.id);
}

export async function revokeFoundingCasePurchase(input: {
  purchaseId?: string | null;
  providerTransactionId?: string | null;
  refundedAmountCents?: number;
  reason: string;
}) {
  const where = input.purchaseId
    ? eq(qualityCasePurchases.id, input.purchaseId)
    : input.providerTransactionId
      ? eq(qualityCasePurchases.providerTransactionId, input.providerTransactionId)
      : null;
  if (!where) return null;
  const now = new Date();
  const [purchase] = await db.update(qualityCasePurchases).set({
    status: "refunded",
    refundedAmountCents: Math.max(0, input.refundedAmountCents || 0),
    revokedAt: now,
    failureCode: input.reason.slice(0, 80),
    updatedAt: now,
  }).where(where).returning();
  if (!purchase) return null;
  await db.update(qualityCaseEntitlements).set({
    status: "revoked",
    revokedAt: now,
    revokeReason: input.reason.slice(0, 120),
    updatedAt: now,
  }).where(eq(qualityCaseEntitlements.purchaseId, purchase.id));
  return purchase;
}

export async function getFoundingCasePurchaseForUser(purchaseId: string, userId: string) {
  const [purchase] = await db.select({
    id: qualityCasePurchases.id,
    status: qualityCasePurchases.status,
    caseId: qualityCasePurchases.caseId,
    failureCode: qualityCasePurchases.failureCode,
    amountPaidCents: qualityCasePurchases.amountPaidCents,
    currency: qualityCasePurchases.currency,
  }).from(qualityCasePurchases).where(and(
    eq(qualityCasePurchases.id, purchaseId),
    eq(qualityCasePurchases.userId, userId),
  )).limit(1);
  return purchase || null;
}

export async function hasActiveFoundingCaseEntitlement(userId: string, caseId: string) {
  const [entitlement] = await db.select({ id: qualityCaseEntitlements.id })
    .from(qualityCaseEntitlements)
    .where(and(
      eq(qualityCaseEntitlements.userId, userId),
      eq(qualityCaseEntitlements.caseId, caseId),
      eq(qualityCaseEntitlements.status, "active"),
    )).limit(1);
  return Boolean(entitlement);
}
