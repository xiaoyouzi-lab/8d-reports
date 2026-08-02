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
        eventId: crypto.randomUUID(),
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

export function RejectCheckIntake() {
  const router = useRouter()
  const [reportText, setReportText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    void sendReviewEvent("review_landing_view")
  }, [])

  const markStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    void sendReviewEvent("review_upload_started")
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!reportText.trim() && !file) {
      setError("Paste report content or choose a TXT/DOCX file first.")
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
        throw new Error(data?.error || "The free review could not be generated.")
      }
      router.push(data.redirectPath)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The free review could not be generated.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Run a free rejection check</h2>
          <p className="mt-1 text-sm text-slate-600">See submission status, the three most serious risks, and missing-information categories.</p>
        </div>
        <FileText className="size-7 shrink-0 text-indigo-600" aria-hidden="true" />
      </div>

      <label htmlFor="reject-check-report" className="mt-6 block text-sm font-medium text-slate-900">
        Paste your 8D, SCAR, or corrective-action response
      </label>
      <textarea
        id="reject-check-report"
        value={reportText}
        onFocus={markStarted}
        onChange={(event) => setReportText(event.target.value)}
        rows={10}
        maxLength={60_000}
        placeholder="Include the report sections you plan to submit. Missing facts stay missing; the review will not invent dates, quantities, evidence, causes, approvals, or results."
        className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />

      <div className="my-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or upload
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm transition hover:border-indigo-400 hover:bg-indigo-50/40">
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Upload className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-slate-900">{file?.name || "Choose TXT or DOCX"}</span>
          <span className="block text-xs text-slate-500">Up to 5 MB. The original file is not stored in object storage.</span>
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
        PDF upload is intentionally not enabled until extraction reliability passes fixture and Preview validation.
      </p>

      {error && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-5 w-full bg-indigo-600 text-white hover:bg-indigo-700">
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
        {loading ? "Checking submission risk…" : "Check my report free"}
      </Button>
      <p className="mt-3 text-center text-xs leading-5 text-slate-500">
        Complete Rejection Risk Review is $39 per report. No subscription required.
      </p>
    </form>
  )
}
