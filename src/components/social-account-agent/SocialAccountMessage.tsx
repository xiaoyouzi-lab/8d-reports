"use client"

import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface SocialAccountMessageProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export function SocialAccountMessage({ role, content, timestamp }: SocialAccountMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
          <Globe className="size-4 text-teal-600" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-teal-600 text-white"
            : "bg-gray-100 text-foreground"
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        <div
          className={cn(
            "mt-1 text-right text-xs",
            isUser ? "text-teal-200" : "text-muted-foreground"
          )}
        >
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-600">
          <span className="text-xs font-bold text-white">You</span>
        </div>
      )}
    </div>
  )
}
