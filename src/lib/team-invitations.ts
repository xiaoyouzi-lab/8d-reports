import { createHash, randomBytes } from "node:crypto";

export const TEAM_INVITE_TTL_DAYS = 14;
export const TEAM_INVITE_STATUSES = ["pending", "accepted"] as const;

export type TeamInviteStatus = (typeof TEAM_INVITE_STATUSES)[number];

export function normalizeInviteEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken(now: Date = new Date()): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + TEAM_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash: hashInviteToken(token), expiresAt };
}

export function isInviteExpired(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return true;
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return true;
  return expires.getTime() <= now.getTime();
}

export function isTeamInviteStatus(value: unknown): value is TeamInviteStatus {
  return typeof value === "string" && (TEAM_INVITE_STATUSES as readonly string[]).includes(value);
}
