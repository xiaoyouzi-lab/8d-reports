"use client"

import { useState } from "react"
import { Globe, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SocialAccountChatDialog } from "./SocialAccountChatDialog"
import { cn } from "@/lib/utils"

interface SocialAccountAgentFabProps {
  locale?: string
}

export function SocialAccountAgentFab({ locale = "en" }: SocialAccountAgentFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        size="default"
        className={cn(
          "fixed bottom-6 right-20 z-50 shadow-lg transition-all duration-200",
          open
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-teal-600 hover:bg-teal-700 animate-pulse-subtle"
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
            <Globe className="size-4" />
            <span className="hidden sm:inline text-sm font-medium">
              {locale === "zh-CN" ? "社交账户" : "Social"}
            </span>
          </>
        )}
      </Button>

      <SocialAccountChatDialog open={open} onClose={() => setOpen(false)} locale={locale} />
    </>
  )
}
