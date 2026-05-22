import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => {
  let locale = "en"
  try {
    const { cookies } = await import("next/headers")
    const store = await cookies()
    const val = store.get("NEXT_LOCALE")?.value
    if (val === "zh-CN") locale = "zh-CN"
  } catch { /* use default */ }

  if (locale === "zh-CN") {
    return {
      locale: "zh-CN",
      messages: (await import("../messages/zh-CN.json")).default,
      timeZone: "Asia/Shanghai",
    }
  }

  return {
    locale: "en",
    messages: (await import("../messages/en.json")).default,
    timeZone: "Asia/Shanghai",
  }
})
