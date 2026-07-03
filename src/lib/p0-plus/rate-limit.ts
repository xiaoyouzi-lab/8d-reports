import {
  P0_PLUS_PREVIEW_MAX_BODY_BYTES,
  P0_PLUS_PREVIEW_MAX_INPUT_CHARS,
  P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS,
} from "@/lib/p0-plus/config";

export type P0PlusRateLimitDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; reason: "rate_limited" | "body_too_large" | "input_too_short" | "input_too_long" };

interface Bucket {
  count: number;
  resetAt: number;
}

export interface P0PlusRateLimiter {
  check(input: {
    now?: number;
    ipKey: string;
    browserKey?: string | null;
    bodyBytes?: number | null;
    visibleText: string;
  }): P0PlusRateLimitDecision;
}

const BURST_WINDOW_MS = 5 * 60 * 1000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_BURST_PER_KEY = 2;
const MAX_DAILY_PER_BROWSER = 5;
const MAX_DAILY_PER_IP = 20;

function visibleLength(value: string) {
  return value.replace(/\s+/g, "").length;
}

export class InMemoryP0PlusRateLimiter implements P0PlusRateLimiter {
  private buckets = new Map<string, Bucket>();

  check(input: {
    now?: number;
    ipKey: string;
    browserKey?: string | null;
    bodyBytes?: number | null;
    visibleText: string;
  }): P0PlusRateLimitDecision {
    const length = visibleLength(input.visibleText);
    if (input.bodyBytes !== undefined && input.bodyBytes !== null && input.bodyBytes > P0_PLUS_PREVIEW_MAX_BODY_BYTES) {
      return { allowed: false, remaining: 0, reason: "body_too_large" };
    }
    if (input.visibleText.length > P0_PLUS_PREVIEW_MAX_INPUT_CHARS) {
      return { allowed: false, remaining: 0, reason: "input_too_long" };
    }
    if (length < P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS) {
      return { allowed: false, remaining: 0, reason: "input_too_short" };
    }

    const now = input.now || Date.now();
    this.sweep(now);
    const checks = [
      { key: `ip:${input.ipKey}:burst`, max: MAX_BURST_PER_KEY, windowMs: BURST_WINDOW_MS },
      { key: `ip:${input.ipKey}:day`, max: MAX_DAILY_PER_IP, windowMs: DAILY_WINDOW_MS },
    ];
    if (input.browserKey) {
      checks.push(
        { key: `browser:${input.browserKey}:burst`, max: MAX_BURST_PER_KEY, windowMs: BURST_WINDOW_MS },
        { key: `browser:${input.browserKey}:day`, max: MAX_DAILY_PER_BROWSER, windowMs: DAILY_WINDOW_MS },
      );
    }

    const remainingValues: number[] = [];
    for (const check of checks) {
      const bucket = this.buckets.get(check.key);
      if (bucket && bucket.resetAt > now && bucket.count >= check.max) {
        return { allowed: false, remaining: 0, reason: "rate_limited" };
      }
    }

    for (const check of checks) {
      const existing = this.buckets.get(check.key);
      const bucket = existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + check.windowMs };
      bucket.count += 1;
      this.buckets.set(check.key, bucket);
      remainingValues.push(Math.max(0, check.max - bucket.count));
    }

    return { allowed: true, remaining: Math.min(...remainingValues) };
  }

  private sweep(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }

  resetForTests() {
    this.buckets.clear();
  }
}

export const p0PlusRateLimiter = new InMemoryP0PlusRateLimiter();
