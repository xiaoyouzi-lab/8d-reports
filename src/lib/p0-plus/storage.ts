import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { p0PlusPreviews } from "@/lib/db/schema";
import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";

export const P0_PLUS_CONVERSION_CLAIM_TTL_MS = 10 * 60 * 1000;

export interface P0PlusPreviewRecord {
  id: string;
  tokenHash: string;
  boundedRawInput: string;
  outputLanguage: string;
  previewPayloadJson: P0PlusPreviewResponse;
  clientIpHash: string;
  browserTokenHash: string | null;
  expiresAt: Date;
  convertedReportId: string | null;
  conversionClaimToken: string | null;
  conversionClaimedAt: Date | null;
  conversionClaimExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateP0PlusPreviewInput {
  tokenHash: string;
  boundedRawInput: string;
  outputLanguage: string;
  previewPayloadJson: P0PlusPreviewResponse;
  clientIpHash: string;
  browserTokenHash?: string | null;
  expiresAt: Date;
}

export interface P0PlusPreviewStorage {
  create(input: CreateP0PlusPreviewInput): Promise<P0PlusPreviewRecord>;
  findActiveByTokenHash(tokenHash: string, now?: Date): Promise<P0PlusPreviewRecord | null>;
}

export interface P0PlusPreviewConversionStorage extends P0PlusPreviewStorage {
  claimConversion(previewId: string, claimToken: string, now?: Date): Promise<P0PlusPreviewRecord | null>;
  clearConversionClaim(previewId: string, claimToken: string, now?: Date): Promise<void>;
  markConverted(previewId: string, reportId: string, claimToken: string, now?: Date): Promise<P0PlusPreviewRecord | null>;
}

function toPreviewRecord(row: typeof p0PlusPreviews.$inferSelect): P0PlusPreviewRecord {
  return {
    ...row,
    previewPayloadJson: row.previewPayloadJson as P0PlusPreviewResponse,
  };
}

export class DbP0PlusPreviewStorage implements P0PlusPreviewConversionStorage {
  async create(input: CreateP0PlusPreviewInput): Promise<P0PlusPreviewRecord> {
    const [created] = await db
      .insert(p0PlusPreviews)
      .values({
        tokenHash: input.tokenHash,
        boundedRawInput: input.boundedRawInput,
        outputLanguage: input.outputLanguage,
        previewPayloadJson: input.previewPayloadJson,
        clientIpHash: input.clientIpHash,
        browserTokenHash: input.browserTokenHash || null,
        expiresAt: input.expiresAt,
      })
      .returning();

    return toPreviewRecord(created);
  }

  async findActiveByTokenHash(tokenHash: string, now = new Date()): Promise<P0PlusPreviewRecord | null> {
    const [row] = await db
      .select()
      .from(p0PlusPreviews)
      .where(and(eq(p0PlusPreviews.tokenHash, tokenHash), gt(p0PlusPreviews.expiresAt, now)))
      .limit(1);

    return row ? toPreviewRecord(row) : null;
  }

  async claimConversion(previewId: string, claimToken: string, now = new Date()): Promise<P0PlusPreviewRecord | null> {
    const [row] = await db
      .update(p0PlusPreviews)
      .set({
        conversionClaimToken: claimToken,
        conversionClaimedAt: now,
        conversionClaimExpiresAt: new Date(now.getTime() + P0_PLUS_CONVERSION_CLAIM_TTL_MS),
        updatedAt: now,
      })
      .where(and(
        eq(p0PlusPreviews.id, previewId),
        isNull(p0PlusPreviews.convertedReportId),
        gt(p0PlusPreviews.expiresAt, now),
        or(
          isNull(p0PlusPreviews.conversionClaimToken),
          isNull(p0PlusPreviews.conversionClaimExpiresAt),
          lte(p0PlusPreviews.conversionClaimExpiresAt, now),
        ),
      ))
      .returning();

    return row ? toPreviewRecord(row) : null;
  }

  async clearConversionClaim(previewId: string, claimToken: string, now = new Date()): Promise<void> {
    await db
      .update(p0PlusPreviews)
      .set({
        conversionClaimToken: null,
        conversionClaimedAt: null,
        conversionClaimExpiresAt: null,
        updatedAt: now,
      })
      .where(and(eq(p0PlusPreviews.id, previewId), eq(p0PlusPreviews.conversionClaimToken, claimToken)));
  }

  async markConverted(previewId: string, reportId: string, claimToken: string, now = new Date()): Promise<P0PlusPreviewRecord | null> {
    const [row] = await db
      .update(p0PlusPreviews)
      .set({
        convertedReportId: reportId,
        conversionClaimToken: null,
        conversionClaimedAt: null,
        conversionClaimExpiresAt: null,
        updatedAt: now,
      })
      .where(and(
        eq(p0PlusPreviews.id, previewId),
        isNull(p0PlusPreviews.convertedReportId),
        eq(p0PlusPreviews.conversionClaimToken, claimToken),
        gt(p0PlusPreviews.conversionClaimExpiresAt, now),
      ))
      .returning();

    return row ? toPreviewRecord(row) : null;
  }
}

export const p0PlusPreviewStorage = new DbP0PlusPreviewStorage();
