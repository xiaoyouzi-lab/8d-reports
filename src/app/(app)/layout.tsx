import { cookies } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import { AppShell } from "@/components/app/AppShell"

// The (app) interior is rendered in the language remembered in the NEXT_LOCALE
// cookie. The cookie is read on the server (next/headers), validated against the
// same supported set the proxy uses, and used to render a nested intl provider,
// so the first paint is already Chinese for a zh-CN reader (no flash). Public
// marketing, auth, and share pages keep their URL-driven locale.
const LANG_COOKIE = "NEXT_LOCALE"
const SUPPORTED_LOCALES = new Set(["en", "zh-CN"])
const DEFAULT_LOCALE = "en"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const requestedLocale = (await cookies()).get(LANG_COOKIE)?.value
  const locale =
    requestedLocale && SUPPORTED_LOCALES.has(requestedLocale)
      ? requestedLocale
      : DEFAULT_LOCALE

  const enMessages = (await import("../../messages/en.json")).default
  const zhMessages = (await import("../../messages/zh-CN.json")).default

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "zh-CN" ? zhMessages : enMessages}
      timeZone="UTC"
    >
      <AppShell locale={locale}>{children}</AppShell>
    </NextIntlClientProvider>
  )
}
