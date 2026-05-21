"use client"

import { useMemo } from "react"
import { User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

function renderContent(text: string) {
  const parts: Array<{ type: "text" | "bold"; content: string }> = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: "bold", content: match[1] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) })
  }

  return parts.length > 0
    ? parts
    : [{ type: "text" as const, content: text }]
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user"

  const renderedContent = useMemo(() => {
    if (isUser) {
      return <span className="whitespace-pre-wrap">{content}</span>
    }
    return (
      <span className="whitespace-pre-wrap">
        {renderContent(content).map((part, i) =>
          part.type === "bold" ? (
            <strong key={i}>{part.content}</strong>
          ) : (
            <span key={i}>{part.content}</span>
          )
        )}
      </span>
    )
  }, [content, isUser])

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
        <div>{renderedContent}</div>
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
