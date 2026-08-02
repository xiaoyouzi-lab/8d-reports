"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isSensitiveAnalyticsPath } from "@/lib/sensitive-analytics";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId || isSensitiveAnalyticsPath(pathname)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: ${JSON.stringify(pathname)}
          });
        `}
      </Script>
    </>
  );
}
