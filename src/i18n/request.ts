import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => {
  let locale = "en"

  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value
    if (localeCookie === "en" || localeCookie === "zh-CN") {
      locale = localeCookie
    }
  } catch {
    // fallback to default "en"
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Shanghai",
  }
})
