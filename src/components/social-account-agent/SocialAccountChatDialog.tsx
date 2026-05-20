"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Globe, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SocialAccountMessage } from "./SocialAccountMessage"
import type { SuggestedAction, IssueReport, CollaborationRequest } from "@/lib/social-account-agent/types"

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
  issuesReported?: IssueReport[]
  collaborationRequests?: CollaborationRequest[]
}

const WELCOME_MESSAGES: Record<string, string> = {
  "zh-CN":
    "你好！我是**社交账户运营专家**。\n\n我可以帮你：\n📱 **创建与设计社交账户** — 选择最优平台、设计品牌视觉形象\n🔍 **社交情报收集** — 品牌监控、竞品分析、行业趋势、用户洞察\n📝 **内容发布管理** — 多平台内容策略、日历规划、热点借势\n🧪 **商业想法验证** — 利用社交平台低成本验证市场需求\n⚠️ **问题检测上报** — 自动感知运营问题，主动协调专家解决\n🤖 **自动化运营** — 搭建定时发布、监控告警、数据报表系统\n\n**支持平台：** Twitter/X、Facebook、Instagram、LinkedIn、TikTok、YouTube、Reddit、微博、小红书、抖音、知乎、B站等20+全球平台。\n\n遇到任何问题我都会主动上报并协调相关专家解决，确保运营稳定运行。请告诉我你的需求！",
  en: "Hello! I'm your **Social Account Operations Expert**.\n\nI can help you with:\n📱 **Account Creation & Design** — Platform selection, brand visual identity\n🔍 **Social Intelligence** — Brand monitoring, competitive analysis, trend tracking\n📝 **Content Publishing** — Multi-platform content strategy, calendar planning\n🧪 **Idea Validation** — Low-cost market validation via social platforms\n⚠️ **Issue Detection & Escalation** — Auto-detect problems, coordinate experts\n🤖 **Automation** — Scheduled publishing, monitoring alerts, data reporting\n\n**Supported Platforms:** Twitter/X, Facebook, Instagram, LinkedIn, TikTok, YouTube, Reddit, Weibo, Xiaohongshu, Douyin, Zhihu, Bilibili and 20+ more.\n\nI proactively report any issues and coordinate with relevant experts to ensure stable operations. Tell me what you need!",
}

const PLACEHOLDERS: Record<string, string> = {
  "zh-CN": "描述你的社交运营需求...",
  en: "Describe your social media needs...",
}

const THINKING_TEXT: Record<string, string> = {
  "zh-CN": "分析中...",
  en: "Analyzing...",
}

const ERROR_TEXT: Record<string, string> = {
  "zh-CN": "抱歉，我暂时无法处理你的请求。请稍后再试。",
  en: "Sorry, I'm unable to process your request right now. Please try again later.",
}

const ACTION_TYPE_ICONS: Record<string, string> = {
  create_account: "📱",
  gather_intelligence: "🔍",
  publish_content: "📝",
  validate_idea: "🧪",
  report_issue: "⚠️",
  escalate: "🚨",
  automate: "🤖",
  monitor: "📊",
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: "🔴 严重",
  major: "🟠 重要",
  minor: "🟡 一般",
}

export function SocialAccountChatDialog({ open, onClose, locale = "en" }: ChatDialogProps) {
  const [messages, setMessages] = useState<LocalMessage[]>(() => {
    const welcomeText = WELCOME_MESSAGES[locale] || WELCOME_MESSAGES.en
    return [{
      id: "welcome",
      role: "assistant" as const,
      content: welcomeText,
      timestamp: Date.now(),
    }]
  })
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const welcomeShownRef = useRef(false)

  useEffect(() => {
    if (open && !welcomeShownRef.current) {
      welcomeShownRef.current = true
    }
  }, [open])

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

      const res = await fetch("/api/social-account-agent", {
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
        issuesReported: data.issuesReported,
        collaborationRequests: data.collaborationRequests,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: ERROR_TEXT[locale] || ERROR_TEXT.en,
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
    <div className="fixed bottom-20 right-16 z-50 flex flex-col w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <Globe className="size-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              {locale === "zh-CN" ? "社交账户运营专家" : "Social Account Expert"}
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
            <SocialAccountMessage
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
            {msg.issuesReported && msg.issuesReported.length > 0 && (
              <div className="px-4 py-2">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">
                      {locale === "zh-CN" ? "检测到问题，已自动上报" : "Issues detected, escalated"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.issuesReported.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-amber-700">
                        <span>{SEVERITY_LABELS[issue.severity] || "⚠️"}</span>
                        <span>{issue.description}</span>
                      </div>
                    ))}
                  </div>
                  {msg.collaborationRequests && msg.collaborationRequests.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200">
                      <span className="text-xs text-amber-600">
                        {locale === "zh-CN"
                          ? `已请求 ${msg.collaborationRequests.map((r) => r.targetExpert).join("、")} 协助处理`
                          : `Requested help from: ${msg.collaborationRequests.map((r) => r.targetExpert).join(", ")}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="px-4 py-2">
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestedActions.filter((a) => a.priority === "high").map((action, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
                    >
                      {ACTION_TYPE_ICONS[action.type] || "📌"}
                      {action.title}
                    </span>
                  ))}
                  {msg.suggestedActions.filter((a) => a.priority === "medium").map((action, i) => (
                    <span
                      key={`m-${i}`}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50/50 px-2.5 py-1 text-xs font-medium text-teal-600"
                    >
                      {ACTION_TYPE_ICONS[action.type] || "📌"}
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
            <div className="flex size-8 items-center justify-center rounded-full bg-teal-100">
              <Globe className="size-4 text-teal-600" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 px-4 py-2.5">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {THINKING_TEXT[locale] || THINKING_TEXT.en}
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
            placeholder={PLACEHOLDERS[locale] || PLACEHOLDERS.en}
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-300 placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon-sm"
            className="shrink-0 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
