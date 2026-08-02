"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { isSensitiveAnalyticsUrl } from "@/lib/sensitive-analytics";

function beforeSend(event: BeforeSendEvent) {
  return isSensitiveAnalyticsUrl(event.url) ? null : event;
}

export function SafeAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
