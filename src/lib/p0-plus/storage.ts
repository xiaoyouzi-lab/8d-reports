import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { p0PlusPreviews } from "@/lib/db/schema";
import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";

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

function toPreviewRecord(row: typeof p0PlusPreviews.$inferSelect): P0PlusPreviewRecord {
  return {
    ...row,
    previewPayloadJson: row.previewPayloadJson as P0PlusPreviewResponse,
  };
}

export class DbP0PlusPreviewStorage implements P0PlusPreviewStorage {
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
}

export const p0PlusPreviewStorage = new DbP0PlusPreviewStorage();
