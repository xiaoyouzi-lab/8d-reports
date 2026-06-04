"use client"

type EventMetadata = Record<string, unknown>;
type AnalyticsPlan = "free" | "pro" | "team";

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

  window.gtag?.("event", eventName, {
    ...metadata,
    report_id: reportId,
    page_path: window.location.pathname,
  });

  const metadataPlan = metadata.plan;
  const plan: AnalyticsPlan = metadataPlan === "pro" || metadataPlan === "team"
    ? metadataPlan
    : "free";

  const body = {
    eventName,
    reportId,
    metadata,
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
