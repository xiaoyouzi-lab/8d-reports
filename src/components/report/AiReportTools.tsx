"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { ReportData } from "@/lib/report-steps"
import { trackEvent } from "@/lib/analytics"

interface AiReportToolsProps {
  reportId: string
  reportData: ReportData
  onApplyDraft: (fields: Partial<ReportData>) => void
}

type AiOutput = Record<string, unknown>
type AiSection = { title: string; value: unknown }

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json|markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function normalizeAiOutput(value: unknown): AiOutput | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as AiOutput
  if (typeof value !== "string") return null
  const text = stripCodeFence(value)
  if (!text) return null
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as AiOutput
  } catch {
    return { summaryText: text }
  }
  return null
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>
          return [record.step, record.field, record.comment, record.reason, record.suggestedText]
            .map(toText)
            .filter(Boolean)
            .join(" — ")
        }
        return toText(item)
      })
      .filter(Boolean)
  }
  const text = toText(value)
  if (!text) return []
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
}

function ResultSection({ title, value }: AiSection) {
  const items = toList(value)
  if (items.length === 0) return null
  return (
    <div className="rounded-lg border bg-white p-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AiReviewResult({ output }: { output: AiOutput }) {
  const score = toText(output.overallScore)
  const readiness = toText(output.readiness)
  const summary = toText(output.summaryText)
  const hasStructuredSections = [
    output.criticalIssues,
    output.missingInformation,
    output.customerRejectionRisks,
    output.improvementSuggestions,
    output.revisedWordingSuggestions,
    output.sectionScores,
  ].some((value) => toList(value).length > 0)

  if (summary && !hasStructuredSections) {
    return (
      <div className="rounded-lg border bg-white p-3">
        <h3 className="text-sm font-semibold">AI review summary</h3>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          {summary.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph.replace(/^#+\s*/, "")}</p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Readiness</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{readiness.replace(/_/g, " ") || "Needs review"}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall score</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{score || "No score provided"}</div>
        </div>
      </div>
      <ResultSection title="Critical issues" value={output.criticalIssues} />
      <ResultSection title="Missing evidence / information" value={output.missingInformation} />
      <ResultSection title="Root cause and section concerns" value={output.sectionScores} />
      <ResultSection title="Corrective action improvements" value={output.improvementSuggestions} />
      <ResultSection title="Customer rejection risks" value={output.customerRejectionRisks} />
      <ResultSection title="Suggested wording improvements" value={output.revisedWordingSuggestions} />
      {!hasStructuredSections && (
        <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
          AI returned no detailed findings. Review the report manually before customer submission.
        </div>
      )}
    </div>
  )
}

function AiDraftResult({ draftFields, onApply }: { draftFields: Partial<ReportData>; onApply: () => void }) {
  const entries = Object.entries(draftFields).filter(([, value]) => String(value || "").trim())
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
        AI did not return draft fields. Add more source material and try again.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Draft preview</h3>
        <Button size="sm" onClick={onApply}>Apply to empty fields</Button>
      </div>
      <div className="grid gap-2 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-md bg-slate-50 p-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</div>
            <div className="mt-1 whitespace-pre-wrap text-foreground">{String(value || "")}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AiReportTools({ reportId, reportData, onApplyDraft }: AiReportToolsProps) {
  const [open, setOpen] = useState(false)
  const [materials, setMaterials] = useState("")
  const [review, setReview] = useState<AiOutput | null>(null)
  const [draft, setDraft] = useState<AiOutput | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [loading, setLoading] = useState<"review" | "draft" | null>(null)

  const runReview = async () => {
    setLoading("review")
    try {
      trackEvent("ai_report_review_clicked", {}, reportId)
      const res = await fetch("/api/ai/report-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "AI review failed")
      const output = normalizeAiOutput(data?.output)
      if (!output) throw new Error("AI returned an unreadable response. Please try again.")
      setReview(output)
      setReviewError(null)
      toast.success("Quality review generated")
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI review failed"
      setReviewError(message)
      toast.error(message)
    } finally {
      setLoading(null)
    }
  }

  const runDraft = async () => {
    if (!materials.trim()) {
      toast.error("Paste complaint emails, inspection notes, photos descriptions, or 5-Why notes first")
      return
    }
    setLoading("draft")
    try {
      trackEvent("ai_draft_generate_clicked", {}, reportId)
      const res = await fetch("/api/ai/draft-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, materials, currentReportData: reportData }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "AI draft failed")
      const output = normalizeAiOutput(data?.output)
      if (!output) throw new Error("AI returned an unreadable draft. Please try again.")
      setDraft(output)
      setDraftError(null)
      toast.success("Draft generated for review")
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI draft failed"
      setDraftError(message)
      toast.error(message)
    } finally {
      setLoading(null)
    }
  }

  const draftFields = draft && typeof draft.draftFields === "object" && draft.draftFields !== null
    ? draft.draftFields as Partial<ReportData>
    : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="hidden md:inline-flex" />
        }
      >
          <Sparkles className="size-3.5" />
          AI
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Quality Check — Beta</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-lg border bg-indigo-50 p-3 text-sm text-indigo-950">
            AI Quality Check helps identify missing information and logic risks. It does not approve or certify the report.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-semibold">AI Quality Check — Beta</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Check problem clarity, containment, root cause, corrective action, verification, prevention, and customer rejection risk.
              </p>
              <Button className="mt-3" size="sm" onClick={runReview} disabled={!!loading}>
                {loading === "review" && <Loader2 className="size-3.5 animate-spin" />}
                Review report
              </Button>
            </div>
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-semibold">Generate draft from materials</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                AI Draft uses only your current report fields and the material you provide in this session.
              </p>
              <Button className="mt-3" size="sm" onClick={runDraft} disabled={!!loading}>
                {loading === "draft" && <Loader2 className="size-3.5 animate-spin" />}
                Generate draft
              </Button>
            </div>
          </div>

          <Textarea
            value={materials}
            onChange={(event) => setMaterials(event.target.value)}
            rows={6}
            placeholder="Paste customer complaint email, inspection records, temporary containment, 5-Why notes, and photo descriptions here..."
          />

          {reviewError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {reviewError}
            </div>
          )}

          {review && (
            <div className="rounded-lg border bg-slate-50 p-3">
              <h3 className="mb-3 text-sm font-semibold">AI Quality Check result</h3>
              <AiReviewResult output={review} />
              {process.env.NODE_ENV === "development" && (
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary>Developer raw output</summary>
                  <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-950 p-3 text-slate-50">
                    {JSON.stringify(review, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {draftError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {draftError}
            </div>
          )}

          {draftFields && (
            <AiDraftResult
              draftFields={draftFields}
              onApply={() => {
                onApplyDraft(draftFields)
                trackEvent("ai_draft_applied", {}, reportId)
                toast.success("AI draft applied to empty report fields")
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
