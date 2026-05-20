"use client"

import { User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
          <Sparkles className="size-4 text-indigo-600" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-foreground"
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        <div
          className={cn(
            "mt-1 text-right text-xs",
            isUser ? "text-indigo-200" : "text-muted-foreground"
          )}
        >
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-600">
          <User className="size-4 text-white" />
        </div>
      )}
    </div>
  )
}
