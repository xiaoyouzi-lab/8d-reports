"use client"

import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { enPathFor, isZhPath, zhPathFor } from "@/lib/i18n-routes"

const SWITCH = {
  en: { label: "中文", next: "zh-CN" },
  "zh-CN": { label: "EN", next: "en" },
} as const

export function LangSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const onZhRoute = isZhPath(pathname)
  const config =
    onZhRoute
      ? SWITCH["zh-CN"]
      : SWITCH[locale as keyof typeof SWITCH] ?? SWITCH.en

  const handleSwitch = () => {
    const nextLocale = config.next
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;sameSite=lax`

    // On an existing /zh page, go back to the matching English URL.
    if (onZhRoute) {
      const englishPath =
        (enPathFor(pathname) ?? pathname.replace(/^\/zh(?=\/|$)/, "")) || "/"
      window.location.assign(englishPath)
      return
    }

    // Only navigate when the Chinese page actually exists.
    const zhTarget = zhPathFor(pathname)
    if (nextLocale === "zh-CN" && zhTarget) {
      window.location.assign(zhTarget)
      return
    }

    // No Chinese version yet: keep the URL, remember the preference, reload.
    window.location.reload()
  }

  return (
    <button
      onClick={handleSwitch}
      aria-label="Switch language"
      className={cn(
        "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted",
        className
      )}
    >
      {config.label}
    </button>
  )
}
