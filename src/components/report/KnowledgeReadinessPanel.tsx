"use client"

import { useEffect, useMemo, useRef } from "react"
import { AlertTriangle, CheckCircle2, CircleDashed, Info } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import {
  DEFAULT_REPORT_DATA,
  getKnowledgeReadinessSummary,
  type KnowledgeReadinessStatus,
  type KnowledgeReadinessSummary,
  type ReportData,
} from "@/lib/report-steps"
import { cn } from "@/lib/utils"

type Plan = "free" | "pro" | "team"

const statusStyles: Record<KnowledgeReadinessStatus, string> = {
  Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Needs detail": "border-amber-200 bg-amber-50 text-amber-800",
  Missing: "border-slate-200 bg-slate-50 text-slate-600",
}

const statusIcons: Record<KnowledgeReadinessStatus, typeof CheckCircle2> = {
  Ready: CheckCircle2,
  "Needs detail": AlertTriangle,
  Missing: CircleDashed,
}

export function knowledgeReadinessAnalytics(summary: KnowledgeReadinessSummary, plan: Plan) {
  return {
    missingCount: summary.missingCount,
    hasRootCause: summary.hasRootCause,
    hasCorrectiveAction: summary.hasCorrectiveAction,
    hasValidation: summary.hasValidation,
    hasPrevention: summary.hasPrevention,
    hasLessonsLearned: summary.hasLessonsLearned,
    plan,
  }
}

export function KnowledgeReadinessPanel({
  reportData,
  summary: providedSummary,
  reportId,
  plan,
  location = "editor",
  trackViewed = true,
}: {
  reportData?: ReportData
  summary?: KnowledgeReadinessSummary
  reportId: string
  plan: Plan
  location?: "editor" | "workflow_panel"
  trackViewed?: boolean
}) {
  const summary = useMemo(
    () => providedSummary || getKnowledgeReadinessSummary(reportData || DEFAULT_REPORT_DATA),
    [providedSummary, reportData],
  )
  const viewedTracked = useRef(false)

  useEffect(() => {
    if (!trackViewed || viewedTracked.current) return
    viewedTracked.current = true
    trackEvent("knowledge_readiness_viewed", knowledgeReadinessAnalytics(summary, plan), reportId)
  }, [plan, reportId, summary, trackViewed])

  const needsAttention = summary.missingCount > 0
  const containerTone = needsAttention
    ? "border-amber-200 bg-amber-50/60"
    : "border-emerald-200 bg-emerald-50/60"

  return (
    <section className={cn("rounded-lg border p-3 text-sm", containerTone)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-2">
          <Info className={cn("mt-0.5 size-4 shrink-0", needsAttention ? "text-amber-600" : "text-emerald-600")} />
          <div>
            <h3 className="font-semibold text-foreground">Knowledge readiness</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Completed, submitted, approved, and closed reports become stronger reusable knowledge when these fields are captured.
            </p>
          </div>
        </div>
        <div className={cn(
          "w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
          needsAttention ? "border-amber-200 bg-white text-amber-800" : "border-emerald-200 bg-white text-emerald-800",
        )}>
          {needsAttention ? `${summary.missingCount} need detail` : "Ready for reuse"}
        </div>
      </div>
      <div className={cn(
        "mt-3 grid gap-2",
        location === "workflow_panel" ? "sm:grid-cols-1" : "sm:grid-cols-2",
      )}>
        {summary.items.map((item) => {
          const Icon = statusIcons[item.status]
          return (
            <div key={item.key} className="flex items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs font-medium text-foreground">{item.label}</span>
              </div>
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", statusStyles[item.status])}>
                {item.status}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
