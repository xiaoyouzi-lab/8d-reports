"use client"

type EventMetadata = Record<string, unknown>;

export function trackEvent(
  eventName: string,
  metadata: EventMetadata = {},
  reportId?: string,
) {
  if (typeof window === "undefined") return;

  const body = {
    eventName,
    reportId,
    metadata,
    path: window.location.pathname,
    locale: document.cookie.includes("NEXT_LOCALE=zh-CN") ? "zh-CN" : "en",
    plan: metadata.plan === "pro" ? "pro" : "free",
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
