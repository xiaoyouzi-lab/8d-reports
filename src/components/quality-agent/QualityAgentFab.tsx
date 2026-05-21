"use client"

import { useState } from "react"
import { Sparkles, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatDialog } from "./ChatDialog"
import { cn } from "@/lib/utils"

interface QualityAgentFabProps {
  locale?: string
}

export function QualityAgentFab({ locale = "en" }: QualityAgentFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        size="default"
        className={cn(
          "fixed bottom-6 right-6 z-50 shadow-lg transition-all duration-200",
          open
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-indigo-600 hover:bg-indigo-700 animate-pulse-subtle"
        )}
      >
        {open ? (
          <>
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline text-sm font-medium">
              {locale === "zh-CN" ? "关闭" : "Close"}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            <span className="hidden sm:inline text-sm font-medium">
              {locale === "zh-CN" ? "随便问任何质量问题" : "Ask Anything Quality"}
            </span>
          </>
        )}
      </Button>

      <ChatDialog open={open} onClose={() => setOpen(false)} locale={locale} />
    </>
  )
}
