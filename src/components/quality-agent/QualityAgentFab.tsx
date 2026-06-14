"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Sparkles, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatDialog } from "./ChatDialog"
import { cn } from "@/lib/utils"

interface QualityAgentFabProps {
  locale?: string
}

export function QualityAgentFab({ locale = "en" }: QualityAgentFabProps) {
  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const pathname = usePathname()
  const inReportEditor = pathname?.startsWith("/reports/")
  const label = locale === "zh-CN" ? "质量专家顾问（Beta）" : "Quality Expert Chat (Beta)"

  useEffect(() => {
    fetch("/api/quality-agent/chat")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAvailable(Boolean(data?.available)))
      .catch(() => setAvailable(false))
  }, [])

  if (available !== true) return null

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        size="default"
        className={cn(
          "fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-30 shadow-lg transition-all duration-200",
          "h-10 w-10 sm:h-auto sm:w-auto sm:px-4 rounded-full sm:rounded-md",
          inReportEditor && "bottom-28 sm:bottom-24",
          open
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-indigo-600 hover:bg-indigo-700"
        )}
        style={{ paddingInline: open ? undefined : "0" }}
        title={open ? undefined : label}
      >
        {open ? (
          <>
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline text-sm font-medium ml-1">
              {locale === "zh-CN" ? "关闭" : "Close"}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            <span className="hidden sm:inline text-sm font-medium ml-1">
              {label}
            </span>
          </>
        )}
      </Button>

      <ChatDialog open={open} onClose={() => setOpen(false)} locale={locale} avoidBottomBar={inReportEditor} />
    </>
  )
}
