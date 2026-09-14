"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trackEvent } from "@/lib/analytics"

const COPY = {
  en: {
    name: "Name",
    namePlaceholder: "Jane Smith",
    company: "Company",
    companyPlaceholder: "Company Inc.",
    email: "Work email",
    emailPlaceholder: "name@company.com",
    topic: "Topic",
    topics: [
      ["product_question", "Product question"],
      ["billing", "Billing or account"],
      ["support", "Technical support"],
      ["feedback", "Product feedback"],
    ],
    message: "Message",
    messagePlaceholder: "What are you trying to deliver or validate?",
    send: "Send message",
    sending: "Sending...",
    genericError: "Message could not be sent",
    successTitle: "Message received.",
    successBody: "Thanks for reaching out. Your message has been recorded.",
    toastSuccess: "Message sent",
  },
  "zh-CN": {
    name: "姓名",
    namePlaceholder: "张三",
    company: "公司",
    companyPlaceholder: "某某有限公司",
    email: "工作邮箱",
    emailPlaceholder: "name@company.com",
    topic: "主题",
    topics: [
      ["product_question", "产品问题"],
      ["billing", "账单或账号"],
      ["support", "技术支持"],
      ["feedback", "产品反馈"],
    ],
    message: "留言",
    messagePlaceholder: "你想交付或验证什么？",
    send: "发送消息",
    sending: "正在发送…",
    genericError: "消息发送失败",
    successTitle: "已收到你的消息。",
    successBody: "感谢联系，你的消息已被记录。",
    toastSuccess: "消息已发送",
  },
} as const

export function ContactLeadForm() {
  const locale = useLocale()
  const copy = locale === "zh-CN" ? COPY["zh-CN"] : COPY.en
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") || "").trim()
    const company = String(form.get("company") || "").trim()
    const email = String(form.get("email") || "").trim()
    const topic = String(form.get("topic") || "").trim()
    const message = String(form.get("message") || "").trim()

    try {
      const feedback = [
        "[contact-form]",
        `Name: ${name || "Not provided"}`,
        `Company: ${company || "Not provided"}`,
        `Topic: ${topic || "General"}`,
        "",
        message,
      ].join("\n")

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: 0,
          feedback,
          email,
          locale: locale === "zh-CN" ? "zh-CN" : "en",
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || copy.genericError)

      trackEvent("contact_form_submitted", {
        source: "contact",
        topic: topic || "general",
        providedEmail: Boolean(email),
      })
      setSubmitted(true)
      toast.success(copy.toastSuccess)
      event.currentTarget.reset()
    } catch (err) {
      const messageText = err instanceof Error ? err.message : copy.genericError
      setError(messageText)
      toast.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold text-emerald-950">{copy.successTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          {copy.successBody}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">{copy.name}</Label>
          <Input id="contact-name" name="name" required placeholder={copy.namePlaceholder} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">{copy.company}</Label>
          <Input id="contact-company" name="company" placeholder={copy.companyPlaceholder} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">{copy.email}</Label>
        <Input id="contact-email" name="email" type="email" required placeholder={copy.emailPlaceholder} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-topic">{copy.topic}</Label>
        <select id="contact-topic" name="topic" className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          {copy.topics.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">{copy.message}</Label>
        <Textarea id="contact-message" name="message" rows={4} required placeholder={copy.messagePlaceholder} />
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {copy.sending}</> : copy.send}
      </Button>
    </form>
  )
}
