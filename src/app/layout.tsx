import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/CookieConsent";
import { FeedbackWrapper } from "@/components/feedback/FeedbackWrapper";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
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
    url: "https://www.8d-reports.com",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = "en";
  const messages = (await import("../messages/en.json")).default;

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <CookieConsent />
          <Analytics />
          <GoogleAnalytics />
          <Toaster />
          <FeedbackWrapper />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
