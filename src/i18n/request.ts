import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export default getRequestConfig(async () => {
  let locale = "en"

  try {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value
    if (cookieLocale === "en" || cookieLocale === "zh-CN") {
      locale = cookieLocale
    }
  } catch {
    locale = "en"
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Shanghai",
  }
})
