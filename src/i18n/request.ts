import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => {
  try {
    const { headers } = await import("next/headers")
    const heads = await headers()
    const locale = heads.get("x-locale")

    if (locale === "zh-CN") {
      return {
        locale: "zh-CN",
        messages: (await import("../messages/zh-CN.json")).default,
        timeZone: "Asia/Shanghai",
      }
    }
  } catch { /* fall through to default */ }

  return {
    locale: "en",
    messages: (await import("../messages/en.json")).default,
    timeZone: "Asia/Shanghai",
  }
})
