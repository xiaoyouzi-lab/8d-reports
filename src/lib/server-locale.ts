// The single source of truth for the server-side next-intl locale rule.
//
// Priority (highest first):
//   1. The public URL rule: /zh or /zh/* always renders Chinese, so a remembered
//      cookie can never turn a Chinese page English.
//   2. An authenticated app route (/dashboard, /reports, /knowledge, /admin)
//      follows the NEXT_LOCALE cookie when it is a supported locale.
//   3. Everything else is English.
//
// This module intentionally has no React, next-intl, or I/O dependency so the
// rule is trivial to unit test and can be reused by the request config.

export type ServerLocale = "en" | "zh-CN"

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const

// App-route prefixes are matched as path segments: "/dashboard" and
// "/dashboard/x" match, "/dashboardx" does not. Keep this list in one place so
// the request config and the tests share it.
export const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/reports",
  "/knowledge",
  "/admin",
] as const

const SUPPORTED_LOCALE_SET: ReadonlySet<string> = new Set(SUPPORTED_LOCALES)

function isZhPath(pathname: string): boolean {
  return pathname === "/zh" || pathname.startsWith("/zh/")
}

function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function resolveServerLocale(
  pathname: string | null | undefined,
  cookieLocale: string | null | undefined,
): ServerLocale {
  // 1. The public URL rule always wins.
  if (pathname && isZhPath(pathname)) return "zh-CN"

  // 2. Authenticated app routes follow a validated cookie preference.
  if (
    pathname &&
    isAppRoute(pathname) &&
    cookieLocale &&
    SUPPORTED_LOCALE_SET.has(cookieLocale)
  ) {
    return cookieLocale as ServerLocale
  }

  // 3. Default to English.
  return "en"
}
