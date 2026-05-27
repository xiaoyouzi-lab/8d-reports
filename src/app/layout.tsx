import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/CookieConsent";
import { FeedbackWrapper } from "@/components/feedback/FeedbackWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "8D Reports — Professional 8D Problem-Solving Software",
    template: "%s | 8D Reports",
  },
  description:
    "Create, manage, and export professional 8D reports directly from the factory floor. Structured D0-D8 workflow, one-click PDF/Word export, real-time team collaboration. No spreadsheets.",
  keywords: [
    "8D report",
    "8D problem solving",
    "quality management",
    "8D software",
    "CAPA",
    "root cause analysis",
    "corrective action",
    "8D template",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://8d-reports.com",
    siteName: "8D Reports",
    title: "8D Reports — Professional 8D Problem-Solving Software",
    description:
      "Create professional 8D reports. No spreadsheets needed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "8D Reports — Professional 8D Reporting",
    description: "Professional 8D reports. No spreadsheets.",
  },
  robots: { index: true, follow: true },
};

const SUPPORTED = ["en", "zh-CN"] as const;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale: string = "en";

  try {
    const store = await cookies();
    const val = store.get("NEXT_LOCALE")?.value;
    if (val && SUPPORTED.includes(val as "en" | "zh-CN")) {
      locale = val;
    }
  } catch {
    locale = "en";
  }

  const messages = (await import(`../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <CookieConsent />
          <Analytics />
          <Toaster />
          <FeedbackWrapper />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
