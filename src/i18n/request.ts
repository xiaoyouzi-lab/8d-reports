import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { resolveServerLocale } from "@/lib/server-locale"

// The standard server-side locale rule, shared with the URL-driven public
// provider and the cookie-driven (app) interior: /zh/* always wins, then an
// authenticated app route follows NEXT_LOCALE, otherwise English. The proxy
// forwards the request pathname as x-pathname so this config can apply the
// same rule the browser sees.
export default getRequestConfig(async () => {
  const requestHeaders = await headers()
  const requestCookies = await cookies()

  const locale = resolveServerLocale(
    requestHeaders.get("x-pathname"),
    requestCookies.get("NEXT_LOCALE")?.value,
  )

  return {
    locale,
    messages:
      locale === "zh-CN"
        ? (await import("../messages/zh-CN.json")).default
        : (await import("../messages/en.json")).default,
    timeZone: "Asia/Shanghai",
  }
})
