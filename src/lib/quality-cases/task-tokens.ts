import { createHash, randomBytes } from "node:crypto";

export const QUALITY_CASE_TASK_TOKEN_BYTES = 32;

export function createQualityCaseTaskToken() {
  return randomBytes(QUALITY_CASE_TASK_TOKEN_BYTES).toString("base64url");
}

export function hashQualityCaseTaskToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isActiveQualityCaseTaskLink(input: {
  revokedAt: Date | null;
  expiresAt: Date;
  completedAt?: Date | null;
  now?: Date;
}) {
  if (input.revokedAt || input.completedAt) return false;
  return input.expiresAt.getTime() > (input.now || new Date()).getTime();
}
