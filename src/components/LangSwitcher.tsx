"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const SWITCH = {
  en: { label: "中文", next: "zh-CN" },
  "zh-CN": { label: "EN", next: "en" },
} as const

export function LangSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const config = SWITCH[locale as keyof typeof SWITCH] ?? SWITCH.en

  const handleSwitch = () => {
    const nextLocale = config.next
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;sameSite=lax`
    window.location.href = window.location.pathname + window.location.search
  }

  return (
    <button
      onClick={handleSwitch}
      className={cn(
        "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted",
        className
      )}
    >
      {config.label}
    </button>
  )
}
