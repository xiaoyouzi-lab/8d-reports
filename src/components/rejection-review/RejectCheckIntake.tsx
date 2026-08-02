"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, FileText, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

const SESSION_KEY = "8d_reject_check_session"

function anonymousSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  window.localStorage.setItem(SESSION_KEY, created)
  return created
}

function trafficSource() {
  const params = new URLSearchParams(window.location.search)
  const source = params.get("utm_source")
  const campaign = params.get("utm_campaign")
  if (source) return `utm:${source}${campaign ? `:${campaign}` : ""}`
  try {
    return document.referrer ? `ref:${new URL(document.referrer).hostname}` : "direct"
  } catch {
    return "direct"
  }
}

async function sendReviewEvent(eventName: string, extra: Record<string, unknown> = {}) {
  try {
    await fetch("/api/rejection-review-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId: eventName === "qualified_landing_view"
          ? `qualified-${anonymousSessionId()}`
          : crypto.randomUUID(),
        anonymousSessionId: anonymousSessionId(),
        trafficSource: trafficSource(),
        locale: "en",
        ...extra,
      }),
      keepalive: true,
    })
  } catch {
    // Analytics must never block a confidential report review.
  }
}

const copy = {
  en: {
    title: "Run a free rejection check",
    description: "See submission status, the three most serious risks, and missing-information categories.",
    label: "Paste your 8D, SCAR, or corrective-action response",
    placeholder: "Include the report sections you plan to submit. Missing facts stay missing; the review will not invent dates, quantities, evidence, causes, approvals, or results.",
    divider: "or upload",
    choose: "Choose TXT or DOCX",
    fileHelp: "Up to 5 MB. The original file is not stored in object storage.",
    pdf: "PDF upload is intentionally not enabled until extraction reliability passes fixture and Preview validation.",
    empty: "Paste report content or choose a TXT/DOCX file first.",
    failed: "The free review could not be generated.",
    loading: "Checking submission risk…",
    submit: "Check my report free",
    price: "24-hour Deep Review is $99 per report. One-time purchase, no subscription.",
  },
  "zh-CN": {
    title: "免费检查客户退回风险",
    description: "先看当前是否适合提交、最严重的三项风险和缺失信息类别。",
    label: "粘贴准备提交的 8D、SCAR 或整改回复",
    placeholder: "请包含准备提交的报告章节。缺失事实会保持缺失；系统不会编造日期、数量、证据、原因、批准或验证结果。",
    divider: "或上传文件",
    choose: "选择 TXT 或 DOCX",
    fileHelp: "最大 5 MB；原始文件不会写入对象存储。",
    pdf: "PDF 暂不开放，待文本提取通过固定样本和 Preview 可靠性验证后再加入。",
    empty: "请先粘贴报告内容或选择 TXT/DOCX 文件。",
    failed: "暂时无法生成免费审查，请重试。",
    loading: "正在检查提交风险…",
    submit: "免费检查我的报告",
    price: "24 小时深度审查每份 99 美元，一次购买，不要求订阅。",
  },
} as const

export function RejectCheckIntake({ locale = "en" }: { locale?: keyof typeof copy }) {
  const router = useRouter()
  const content = copy[locale]
  const [reportText, setReportText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    void sendReviewEvent("qualified_landing_view", { locale })
  }, [locale])

  const markStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    void sendReviewEvent("review_upload_started")
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!reportText.trim() && !file) {
      setError(content.empty)
      return
    }
    markStarted()
    setLoading(true)
    setError(null)
    try {
      const body = new FormData()
      body.set("reportText", reportText)
      body.set("anonymousSessionId", anonymousSessionId())
      body.set("trafficSource", trafficSource())
      if (file) body.set("file", file)
      const response = await fetch("/api/rejection-reviews", { method: "POST", body })
      const data = await response.json().catch(() => null)
      if (!response.ok || typeof data?.redirectPath !== "string") {
        throw new Error(data?.error || content.failed)
      }
      router.push(data.redirectPath)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : content.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{content.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{content.description}</p>
        </div>
        <FileText className="size-7 shrink-0 text-indigo-600" aria-hidden="true" />
      </div>

      <label htmlFor="reject-check-report" className="mt-6 block text-sm font-medium text-slate-900">
        {content.label}
      </label>
      <textarea
        id="reject-check-report"
        value={reportText}
        onFocus={markStarted}
        onChange={(event) => setReportText(event.target.value)}
        rows={10}
        maxLength={60_000}
        placeholder={content.placeholder}
        className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />

      <div className="my-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        {content.divider}
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm transition hover:border-indigo-400 hover:bg-indigo-50/40">
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Upload className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-slate-900">{file?.name || content.choose}</span>
          <span className="block text-xs text-slate-500">{content.fileHelp}</span>
        </span>
        <input
          type="file"
          accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onClick={markStarted}
          onChange={(event) => {
            markStarted()
            setFile(event.target.files?.[0] || null)
            setError(null)
          }}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">
        {content.pdf}
      </p>

      {error && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-5 w-full bg-indigo-600 text-white hover:bg-indigo-700">
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
        {loading ? content.loading : content.submit}
      </Button>
      <p className="mt-3 text-center text-xs leading-5 text-slate-500">
        {content.price}
      </p>
    </form>
  )
}
