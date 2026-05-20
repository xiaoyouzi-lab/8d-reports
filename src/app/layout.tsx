import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "8D Reports - Quality Management Software",
  description: "Professional 8D problem-solving reports. No spreadsheets.",
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
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
