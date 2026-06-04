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

export function AiReportTools({ reportId, reportData, onApplyDraft }: AiReportToolsProps) {
  const [open, setOpen] = useState(false)
  const [materials, setMaterials] = useState("")
  const [review, setReview] = useState<AiOutput | null>(null)
  const [draft, setDraft] = useState<AiOutput | null>(null)
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
      setReview(data.output)
      toast.success("Quality review generated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI review failed")
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
      setDraft(data.output)
      toast.success("Draft generated for review")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI draft failed")
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

          {review && (
            <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-50">
              {JSON.stringify(review, null, 2)}
            </pre>
          )}

          {draftFields && (
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Draft preview</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    onApplyDraft(draftFields)
                    trackEvent("ai_draft_applied", {}, reportId)
                    toast.success("AI draft applied to empty report fields")
                  }}
                >
                  Apply to report
                </Button>
              </div>
              <div className="grid gap-2 text-xs">
                {Object.entries(draftFields).map(([key, value]) => (
                  <div key={key} className="rounded bg-muted/40 p-2">
                    <div className="font-semibold text-muted-foreground">{key}</div>
                    <div className="mt-1 whitespace-pre-wrap">{String(value || "")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
