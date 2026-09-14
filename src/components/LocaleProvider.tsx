"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";

type Messages = Record<string, unknown>;

// The active language is driven by the URL, not by a cookie. /zh/* is Chinese
// and every other route is English until a Chinese version exists there. This
// keeps SSR and hydration consistent and means a remembered NEXT_LOCALE
// preference never renders a half-translated English page.
function resolveLocale(pathname: string): "en" | "zh-CN" {
  return pathname === "/zh" || pathname.startsWith("/zh/") ? "zh-CN" : "en";
}

export function LocaleProvider({
  en,
  zh,
  children,
}: {
  en: Messages;
  zh: Messages;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = resolveLocale(pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "zh-CN" ? zh : en}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
