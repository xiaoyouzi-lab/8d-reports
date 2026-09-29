"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowUpRight, BookOpen, CheckCircle2, ClipboardCopy, FileText, Lightbulb, Search, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"
import { usePlan } from "@/lib/use-plan"
import { cn } from "@/lib/utils"

type KnowledgeFilter = "all" | "completed" | "approved" | "submitted" | "closed"
type KnowledgeReportTypeFilter = "all" | "customer_8d" | "internal_8d"
type KnowledgePriorityFilter = "all" | "critical" | "high" | "medium" | "low"

interface KnowledgeEntry {
  id: string
  title: string
  reportNumber: string | null
  status: string
  workflowStatus: string | null
  trustLabel: string
  revision: number
  lockedAt: string | null
  reportType: string
  priority: string
  source: string | null
  problem: string | null
  product: string | null
  customer: string | null
  rootCause: string | null
  correctiveAction: string | null
  lessonsLearned: string | null
  prevention: string | null
  validation: string | null
  matchSnippet: string | null
  matchedField: string | null
  updatedAt: string
  createdAt: string
}

const filters: KnowledgeFilter[] = ["all", "completed", "approved", "submitted", "closed"]

const reportTypeFilters: KnowledgeReportTypeFilter[] = ["all", "customer_8d", "internal_8d"]

const priorityFilters: KnowledgePriorityFilter[] = ["all", "critical", "high", "medium", "low"]

const filterKeys: Record<string, string> = {
  all: "all",
  completed: "completed",
  approved: "approved",
  submitted: "submitted",
  closed: "closed",
}

const reportTypeFilterKeys: Record<string, string> = {
  all: "allTypes",
  customer_8d: "customer8d",
  internal_8d: "internal8d",
}

const priorityFilterKeys: Record<string, string> = {
  all: "allPriorities",
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
}

const REPORT_TYPE_KEYS: Record<string, string> = {
  customer_8d: "customer8d",
  internal_8d: "internal8d",
}

const TRUST_KEYS: Record<string, string> = {
  Completed: "completed",
  Approved: "approved",
  Submitted: "submitted",
  Closed: "closed",
}

const workflowStyles: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Submitted: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  Closed: "bg-slate-100 text-slate-700 ring-slate-600/20",
}

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function shortDate(value: string) {
  try {
    return new Date(value).toISOString().split("T")[0]
  } catch {
    return value
  }
}

function trimText(value: string | null, fallback: string, max = 360) {
  if (!value) return fallback
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}

function CopyButton({
  label,
  value,
  reportId,
  eventName,
  plan,
}: {
  label: string
  value: string | null
  reportId: string
  eventName: "knowledge_root_cause_copied" | "knowledge_corrective_action_copied" | "knowledge_lesson_copied"
  plan: string
}) {
  const t = useTranslations("knowledge")
  const disabled = !value
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled}
      onClick={async () => {
        if (!value) return
        try {
          await navigator.clipboard.writeText(value)
          trackEvent(eventName, { plan }, reportId)
          toast.success(t("copied"))
        } catch {
          toast.error(t("copyFailed"))
        }
      }}
    >
      <ClipboardCopy className="size-3.5" />
      {label}
    </Button>
  )
}

function KnowledgeCard({ entry, plan, hasQuery }: { entry: KnowledgeEntry; plan: string; hasQuery: boolean }) {
  const t = useTranslations("knowledge")
  const te = useTranslations("editor")
  const trustLabel = entry.trustLabel || "Completed"
  const priorityLabel = t.has(entry.priority) ? t(entry.priority) : titleCase(entry.priority)
  const reportTypeLabel = REPORT_TYPE_KEYS[entry.reportType] ? t(REPORT_TYPE_KEYS[entry.reportType]) : titleCase(entry.reportType)
  const trustText = TRUST_KEYS[trustLabel] ? t(TRUST_KEYS[trustLabel]) : trustLabel
  return (
    <Card className="bg-white">
      <CardContent className="space-y-4 p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-indigo-600">
                {entry.reportNumber || entry.id.slice(0, 8)}
              </span>
              <Badge
                variant="outline"
                className={cn("ring-1 ring-inset", workflowStyles[trustLabel] || workflowStyles.Completed)}
              >
                {trustText}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className={cn("inline-block size-2 rounded-full", priorityDot[entry.priority] || priorityDot.medium)} />
                {priorityLabel}
              </span>
              <span className="text-xs text-muted-foreground">{reportTypeLabel}</span>
              <span className="text-xs text-muted-foreground">{te("revShort", { n: entry.revision })}</span>
            </div>
            <h2 className="text-base font-semibold leading-snug text-foreground">
              {entry.title}
            </h2>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {entry.customer && <span>{entry.customer}</span>}
              {entry.product && <span>{entry.product}</span>}
              <span>{t("updated", { date: shortDate(entry.updatedAt) })}</span>
            </div>
          </div>
          <Link
            href={`/reports/${entry.id}`}
            onClick={() => trackEvent("knowledge_result_opened", { plan, hasQuery }, entry.id)}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            <FileText className="size-3.5" />
            {t("openReport")}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {entry.matchSnippet && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
            {entry.matchSnippet}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="size-3.5" />
            {t("problemSummary")}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
            {trimText(entry.problem, t("noRelevantData"))}
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="size-3.5" />
              {t("rootCause")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.rootCause, t("noRelevantData"))}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CheckCircle2 className="size-3.5" />
              {t("correctiveAction")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.correctiveAction, t("noRelevantData"))}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Lightbulb className="size-3.5" />
              {t("lessonsLearned")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.lessonsLearned, t("noRelevantData"))}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CheckCircle2 className="size-3.5" />
              {t("validation")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.validation, t("noRelevantData"))}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="size-3.5" />
              {t("prevention")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.prevention, t("noRelevantData"))}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton label={t("copyRootCause")} value={entry.rootCause} reportId={entry.id} eventName="knowledge_root_cause_copied" plan={plan} />
          <CopyButton label={t("copyCorrectiveAction")} value={entry.correctiveAction} reportId={entry.id} eventName="knowledge_corrective_action_copied" plan={plan} />
          <CopyButton label={t("copyLessonsLearned")} value={entry.lessonsLearned} reportId={entry.id} eventName="knowledge_lesson_copied" plan={plan} />
        </div>
      </CardContent>
    </Card>
  )
}

export function KnowledgeBaseClient() {
  const t = useTranslations("knowledge")
  const { data: session } = authClient.useSession()
  const { plan } = usePlan((session?.user as Record<string, unknown> | undefined)?.plan)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<KnowledgeFilter>("all")
  const [reportType, setReportType] = useState<KnowledgeReportTypeFilter>("all")
  const [priority, setPriority] = useState<KnowledgePriorityFilter>("all")
  const [results, setResults] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const normalizedQuery = query.trim()
  const hasQuery = normalizedQuery.length >= 2

  const loadKnowledge = useCallback(async (
    inputQuery: string,
    inputFilter: KnowledgeFilter,
    inputReportType: KnowledgeReportTypeFilter,
    inputPriority: KnowledgePriorityFilter,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: inputQuery.trim(),
          status: inputFilter,
          reportType: inputReportType,
          priority: inputPriority,
          limit: 50,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || t("searchFailed"))
      const nextResults = Array.isArray(data?.results) ? data.results : []
      setResults(nextResults)
      if (inputQuery.trim().length >= 2) {
        trackEvent("knowledge_search_used", {
          queryLength: inputQuery.trim().length,
          resultCount: nextResults.length,
          filter: inputFilter,
          reportType: inputReportType,
          priority: inputPriority,
          plan,
        })
        if (nextResults.length === 0) {
          trackEvent("knowledge_no_results", {
            queryLength: inputQuery.trim().length,
            filter: inputFilter,
            reportType: inputReportType,
            priority: inputPriority,
            plan,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("searchFailed"))
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [plan, t])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session) return
      void loadKnowledge(query, filter, reportType, priority)
    }, hasQuery ? 250 : 0)
    return () => clearTimeout(timer)
  }, [filter, hasQuery, loadKnowledge, priority, query, reportType, session])

  const assetCount = results.length
  const lockedCount = useMemo(
    () => results.filter((entry) => ["Approved", "Submitted", "Closed"].includes(entry.trustLabel)).length,
    [results],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="size-4" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-80">
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-xs text-muted-foreground">{t("visibleAssets")}</div>
            <div className="font-mono text-xl font-semibold text-foreground">{loading ? "-" : assetCount}</div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-xs text-muted-foreground">{t("lockedRecords")}</div>
            <div className="font-mono text-xl font-semibold text-foreground">{loading ? "-" : lockedCount}</div>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border bg-white p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setFilter(item)
                trackEvent("knowledge_filter_used", { filter: item, plan })
              }}
              className={cn(
                "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
                filter === item
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t(filterKeys[item])}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {reportTypeFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setReportType(item)
                trackEvent("knowledge_filter_used", { reportType: item, plan })
              }}
              className={cn(
                "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
                reportType === item
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t(reportTypeFilterKeys[item])}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {priorityFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setPriority(item)
                trackEvent("knowledge_filter_used", { priority: item, plan })
              }}
              className={cn(
                "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
                priority === item
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t(priorityFilterKeys[item])}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t("loadingAssets")}</div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-12 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-slate-100">
            <BookOpen className="size-5 text-slate-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {hasQuery || filter !== "all" || reportType !== "all" || priority !== "all"
              ? t("noMatching")
              : t("completeFirst")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {hasQuery || filter !== "all" || reportType !== "all" || priority !== "all"
              ? t("tryDifferent")
              : t("closedBecomeSearchable")}
          </p>
          {!hasQuery && filter === "all" && reportType === "all" && priority === "all" && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-7 items-center justify-center rounded-lg bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground hover:bg-primary/80"
              >
                {t("createReport")}
              </Link>
              <Link
                href="/sample-report"
                className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground"
              >
                {t("viewSample")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((entry) => (
            <KnowledgeCard key={entry.id} entry={entry} plan={plan} hasQuery={hasQuery} />
          ))}
        </div>
      )}
    </div>
  )
}
