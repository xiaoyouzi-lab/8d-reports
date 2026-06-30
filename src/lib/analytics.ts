"use client"

import { getGa4EventName } from "@/lib/analytics-taxonomy";

type EventMetadata = Record<string, unknown>;
type AnalyticsPlan = "free" | "pro" | "team";

const SESSION_STORAGE_KEY = "8d_anonymous_session_id";

function safeString(value: string | null | undefined, maxLength = 120) {
  if (!value) return undefined;
  return value.replace(/[\r\n\t]/g, " ").trim().slice(0, maxLength) || undefined;
}

function getAnonymousSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return undefined;
  }
}

function marketingContext(metadata: EventMetadata): EventMetadata {
  const params = new URLSearchParams(window.location.search);
  return {
    ...metadata,
    referrer: safeString(document.referrer, 240),
    utm_source: safeString(params.get("utm_source")),
    utm_medium: safeString(params.get("utm_medium")),
    utm_campaign: safeString(params.get("utm_campaign")),
    anonymousSessionId: getAnonymousSessionId(),
  };
}

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export function trackEvent(
  eventName: string,
  metadata: EventMetadata = {},
  reportId?: string,
) {
  if (typeof window === "undefined") return;

  const enrichedMetadata = marketingContext(metadata);

  window.gtag?.("event", getGa4EventName(eventName, metadata), {
    ...enrichedMetadata,
    report_id: reportId,
    page_path: window.location.pathname,
  });

  const metadataPlan = enrichedMetadata.plan;
  const plan: AnalyticsPlan = metadataPlan === "pro" || metadataPlan === "team"
    ? metadataPlan
    : "free";

  const body = {
    eventName,
    reportId,
    metadata: enrichedMetadata,
    path: window.location.pathname,
    locale: document.cookie.includes("NEXT_LOCALE=zh-CN") ? "zh-CN" : "en",
    plan,
  };

  const payload = JSON.stringify(body);

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
