"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquareText, Star, X, Send, Loader2 } from "lucide-react"

interface FeedbackButtonProps {
  locale?: string
}

const STARS = [1, 2, 3, 4, 5]

const TEXTS: Record<string, {
  button: string
  title: string
  ratingLabel: string
  feedbackLabel: string
  feedbackPlaceholder: string
  emailHint: string
  emailPlaceholder: string
  submit: string
  thanks: string
  close: string
}> = {
  "zh-CN": {
    button: "反馈",
    title: "告诉我们你的想法",
    ratingLabel: "评分",
    feedbackLabel: "反馈内容",
    feedbackPlaceholder: "分享你的使用体验、建议或遇到的问题...",
    emailHint: "如果您希望收到回复，欢迎留下联系邮箱",
    emailPlaceholder: "你的邮箱（选填）",
    submit: "提交反馈",
    thanks: "感谢你的反馈！",
    close: "关闭",
  },
  en: {
    button: "Feedback",
    title: "Share your thoughts",
    ratingLabel: "Rating",
    feedbackLabel: "Feedback",
    feedbackPlaceholder: "Share your experience, suggestions, or issues...",
    emailHint: "If you'd like a reply, please leave your contact email",
    emailPlaceholder: "Your email (optional)",
    submit: "Submit Feedback",
    thanks: "Thank you for your feedback!",
    close: "Close",
  },
}

export function FeedbackButton({ locale = "en" }: FeedbackButtonProps) {
  const isZh = locale === "zh-CN"
  const texts = TEXTS[isZh ? "zh-CN" : "en"]

  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback, email: email || undefined, locale }),
      })
      if (!res.ok) throw new Error("Failed")
      setSent(true)
    } catch {
      // ignore — feedback sent or not, don't disrupt user
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(!open); setSent(false) }}
        className="fixed bottom-6 left-6 z-50 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-lg ring-1 ring-black/5 transition-all hover:text-foreground hover:shadow-xl"
      >
        <MessageSquareText className="size-4" />
        <span className="hidden sm:inline">{texts.button}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-16 left-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-400">
            <span className="text-sm font-semibold text-white">{texts.title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                <Send className="size-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-foreground">{texts.thanks}</span>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  {texts.ratingLabel}
                </label>
                <div className="flex items-center gap-1">
                  {STARS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`size-6 ${(hoverRating || rating) >= s ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {texts.feedbackLabel}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={texts.feedbackPlaceholder}
                  rows={3}
                  className="w-full resize-none rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 placeholder:text-muted-foreground/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {texts.emailHint}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={texts.emailPlaceholder}
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 placeholder:text-muted-foreground/60"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {texts.submit}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
