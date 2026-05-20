"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "./ChatMessage"
import type { SuggestedAction } from "@/lib/quality-agent/types"

interface ChatDialogProps {
  open: boolean
  onClose: () => void
  locale?: string
}

interface LocalMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  references?: Array<{ entryId: string; title: string; category: string; relevance: number }>
  suggestedActions?: SuggestedAction[]
}

const WELCOME_MESSAGES: Record<string, string> = {
  "zh-CN":
    "你好！我是**质量专家顾问**。\n\n我精通全球质量管理体系（ISO 9001、IATF 16949、AS9100、ISO 13485等）、方法论（六西格玛、精益、TQM、Kaizen、8D）、质量工具（FMEA、SPC、MSA、APQP、PPAP等）。\n\n无论你是世界500强、中型企业还是小作坊，我都能根据你的实际情况提供切实可行的质量建议。\n\n请告诉我你的企业情况（规模、行业、国家）以及你关心的质量问题，我会为你提供针对性的指导。",
  en: "Hello! I'm your **Quality Expert Consultant**.\n\nI specialize in global quality management systems (ISO 9001, IATF 16949, AS9100, ISO 13485, etc.), methodologies (Six Sigma, Lean, TQM, Kaizen, 8D), and quality tools (FMEA, SPC, MSA, APQP, PPAP, etc.).\n\nWhether you're a Fortune 500 company, a mid-sized business, or a small workshop, I can provide practical quality advice tailored to your situation.\n\nTell me about your company (size, industry, country) and the quality challenges you're facing, and I'll give you targeted guidance.",
}

export function ChatDialog({ open, onClose, locale = "en" }: ChatDialogProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeText =
        WELCOME_MESSAGES[locale] || WELCOME_MESSAGES.en
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeText,
          timestamp: Date.now(),
        },
      ])
    }
  }, [open, locale])

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
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m.timestamp,
        }))

      const res = await fetch("/api/quality-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          history,
        }),
      })

      if (!res.ok) {
        throw new Error("API error")
      }

      const data = await res.json()

      const assistantMessage: LocalMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        references: data.references,
        suggestedActions: data.suggestedActions,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            locale === "zh-CN"
              ? "抱歉，我暂时无法处理你的问题。请稍后再试。"
              : "Sorry, I'm unable to process your request right now. Please try again later.",
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
    <div className="fixed bottom-20 right-4 z-50 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              {locale === "zh-CN" ? "质量专家顾问" : "Quality Expert"}
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
          <div key={msg.id}>
            <ChatMessage
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="px-4 py-2">
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestedActions.filter(a => a.priority === "high").map((action, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {action.type === "certification" && "📋 "}
                      {action.type === "tool" && "🔧 "}
                      {action.type === "implement" && "⚡ "}
                      {action.type === "next_step" && "🎯 "}
                      {action.type === "learn" && "📖 "}
                      {action.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles className="size-4 text-indigo-600" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 px-4 py-2.5">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {locale === "zh-CN" ? "思考中..." : "Thinking..."}
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
            placeholder={
              locale === "zh-CN"
                ? "输入你的质量问题..."
                : "Ask about quality..."
            }
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
      </div>
    </div>
  )
}
