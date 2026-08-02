import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/CookieConsent";
import { FeedbackWrapper } from "@/components/feedback/FeedbackWrapper";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SafeAnalytics } from "@/components/SafeAnalytics";
import { socialOpenGraphImage, siteUrl } from "@/lib/marketing-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "8D Reports - Customer-Ready 8D Report Software",
    template: "%s | 8D Reports",
  },
  description:
    "Create customer-ready 8D reports with a structured D0-D8 workflow, evidence and attachments, sharing and review, PDF / Word / Excel export, and Team approval, locking, and revision controls.",
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
    url: siteUrl,
    siteName: "8D Reports",
    title: "8D Reports - Customer-Ready 8D Report Software",
    description:
      "A focused D0-D8 response and delivery workspace for quality teams that need evidence, review, sharing, and PDF / Word / Excel export.",
    images: [socialOpenGraphImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "8D Reports - Customer-Ready 8D Reports",
    description:
      "Create structured D0-D8 reports with evidence, review, sharing, and PDF / Word / Excel export.",
    images: [`${siteUrl}/twitter-image`],
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
          <SafeAnalytics />
          <GoogleAnalytics />
          <Toaster position="top-center" offset={72} />
          <FeedbackWrapper />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
