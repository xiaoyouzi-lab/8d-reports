"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "./ChatMessage"

interface ChatDialogProps {
  open: boolean
  onClose: () => void
  locale?: string
  avoidBottomBar?: boolean
}

interface LocalMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

function resolveLocale(propLocale: string): string {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
    const cookieLocale = match?.[1]
    if (cookieLocale === "zh-CN") return "zh-CN"
  }
  if (propLocale === "zh-CN") return "zh-CN"
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  if (match?.[1] === "zh-CN") return "zh-CN"
  return "en"
}

export function ChatDialog({ open, onClose, locale = "en", avoidBottomBar = false }: ChatDialogProps) {
  const t = useTranslations("qualityAgent")
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const resolvedLocale = resolveLocale(locale)

  useEffect(() => {
    if (open && messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: t("welcome") + t("notice"),
            timestamp: Date.now(),
          },
        ])
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, resolvedLocale, messages.length, t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: LocalMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))

      const res = await fetch("/api/quality-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          history,
          locale: resolvedLocale,
        }),
      })

      if (!res.ok) {
        throw new Error("API error")
      }

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: Date.now(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: t("errorMessage"),
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) return null

  return (
    <div className={`fixed right-4 z-50 flex flex-col w-[400px] max-w-[calc(100vw-2rem)] h-[580px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden ${avoidBottomBar ? "bottom-32 max-h-[calc(100vh-12rem)]" : "bottom-20 max-h-[calc(100vh-8rem)]"}`}>
      <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              {t("fabLabel")}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles className="size-4 text-indigo-600" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 px-4 py-2.5">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("thinking")}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder")}
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon-sm"
            className="shrink-0 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
          {t("chatFooter")}
        </p>
      </div>
    </div>
  )
}
