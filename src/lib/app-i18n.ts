import "server-only"
import { cookies } from "next/headers"
import { createTranslator } from "next-intl"

// Server components inside the (app) subtree render in the language remembered
// in the NEXT_LOCALE cookie. This helper resolves the cookie with the same
// supported set the proxy and the (app) layout use and builds a standalone
// translator from the matching catalog. src/i18n/request.ts now applies the same
// rule to the standard getTranslations()/getLocale() APIs, but existing (app)
// server code keeps using this helper so its behavior is unchanged.
const LANG_COOKIE = "NEXT_LOCALE"
const SUPPORTED_LOCALES = new Set(["en", "zh-CN"])
const DEFAULT_LOCALE = "en"

export async function resolveAppLocale(): Promise<string> {
  const requestedLocale = (await cookies()).get(LANG_COOKIE)?.value
  return requestedLocale && SUPPORTED_LOCALES.has(requestedLocale)
    ? requestedLocale
    : DEFAULT_LOCALE
}

export async function getAppTranslator(namespace: string) {
  const locale = await resolveAppLocale()
  const messages = locale === "zh-CN"
    ? (await import("../messages/zh-CN.json")).default
    : (await import("../messages/en.json")).default
  const t = createTranslator({ locale, messages, namespace: namespace as never, timeZone: "UTC" })
  return { locale, t: t as unknown as (key: string, values?: Record<string, string | number>) => string }
}
