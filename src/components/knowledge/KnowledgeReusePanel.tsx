"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardCopy,
  FileText,
  Lightbulb,
  Search,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import type { KnowledgeEntry } from "@/lib/report-knowledge"

export type KnowledgeReuseLocation = "editor_top" | "d4" | "d5" | "d7" | "d8"

type KnowledgeFilter = "all" | "completed" | "approved" | "submitted" | "closed"
type KnowledgeReportTypeFilter = "all" | "customer_8d" | "internal_8d"
type KnowledgePriorityFilter = "all" | "critical" | "high" | "medium" | "low"

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
  critical: "bg-red-600",
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function shortDate(value: string | Date) {
  try {
    return new Date(value).toISOString().split("T")[0]
  } catch {
    return String(value)
  }
}

function trimText(value: string | null, fallback: string, max = 260) {
  if (!value) return fallback
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}

function safeMetadata(
  location: KnowledgeReuseLocation,
  plan: string,
  extra: Record<string, unknown> = {},
) {
  return {
    source: "editor",
    location,
    plan,
    ...extra,
  }
}

function CopyButton({
  label,
  value,
  reportId,
  eventName,
  copiedField,
  location,
  plan,
}: {
  label: string
  value: string | null
  reportId: string
  eventName:
    | "knowledge_reuse_root_cause_copied"
    | "knowledge_reuse_corrective_action_copied"
    | "knowledge_reuse_lesson_copied"
  copiedField: "rootCause" | "correctiveAction" | "lessonsLearned"
  location: KnowledgeReuseLocation
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
          trackEvent(eventName, safeMetadata(location, plan, { copiedField }), reportId)
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

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
        active
          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function KnowledgeReuseCard({
  entry,
  location,
  plan,
  resultCount,
  queryLength,
}: {
  entry: KnowledgeEntry
  location: KnowledgeReuseLocation
  plan: string
  resultCount: number
  queryLength: number
}) {
  const t = useTranslations("knowledge")
  const trustLabel = entry.trustLabel || "Completed"
  const trustText = TRUST_KEYS[trustLabel] ? t(TRUST_KEYS[trustLabel]) : trustLabel
  const priorityLabel = t.has(entry.priority) ? t(entry.priority) : titleCase(entry.priority)
  const reportTypeLabel = REPORT_TYPE_KEYS[entry.reportType] ? t(REPORT_TYPE_KEYS[entry.reportType]) : titleCase(entry.reportType)
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
          </div>
          <h3 className="break-words text-sm font-semibold leading-snug text-foreground">
            {entry.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("updated", { date: shortDate(entry.updatedAt) })}
          </p>
        </div>
        <Link
          href={`/reports/${entry.id}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            trackEvent(
              "knowledge_reuse_result_opened",
              safeMetadata(location, plan, { queryLength, resultCount }),
              entry.id,
            )
          }}
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
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
          <FileText className="size-3.5" />
          {t("problemSummary")}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
          {trimText(entry.problem, t("noRelevantData"))}
        </p>
      </div>

      <div className="grid gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
            <ShieldCheck className="size-3.5" />
            {t("rootCause")}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
            {trimText(entry.rootCause, t("noRelevantData"))}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
            <CheckCircle2 className="size-3.5" />
            {t("correctiveAction")}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
            {trimText(entry.correctiveAction, t("noRelevantData"))}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
            <Lightbulb className="size-3.5" />
            {t("lessonsLearned")}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
            {trimText(entry.lessonsLearned, t("noRelevantData"))}
          </p>
        </div>
      </div>

      {(entry.validation || entry.prevention) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
              <CheckCircle2 className="size-3.5" />
              {t("validation")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.validation, t("noRelevantData"))}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
              <ShieldCheck className="size-3.5" />
              {t("prevention")}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-800">
              {trimText(entry.prevention, t("noRelevantData"))}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <CopyButton
          label={t("copyRootCause")}
          value={entry.rootCause}
          reportId={entry.id}
          eventName="knowledge_reuse_root_cause_copied"
          copiedField="rootCause"
          location={location}
          plan={plan}
        />
        <CopyButton
          label={t("copyCorrectiveAction")}
          value={entry.correctiveAction}
          reportId={entry.id}
          eventName="knowledge_reuse_corrective_action_copied"
          copiedField="correctiveAction"
          location={location}
          plan={plan}
        />
        <CopyButton
          label={t("copyLessonsLearned")}
          value={entry.lessonsLearned}
          reportId={entry.id}
          eventName="knowledge_reuse_lesson_copied"
          copiedField="lessonsLearned"
          location={location}
          plan={plan}
        />
      </div>
    </div>
  )
}

export function KnowledgeReusePanel({
  open,
  onOpenChange,
  location,
  plan,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: KnowledgeReuseLocation
  plan: string
}) {
  const t = useTranslations("knowledge")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<KnowledgeFilter>("all")
  const [reportType, setReportType] = useState<KnowledgeReportTypeFilter>("all")
  const [priority, setPriority] = useState<KnowledgePriorityFilter>("all")
  const [results, setResults] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedQuery = query.trim()
  const queryLength = normalizedQuery.length
  const hasSearchContext = queryLength >= 2 || filter !== "all" || reportType !== "all" || priority !== "all"

  const loadKnowledge = useCallback(async (
    inputQuery: string,
    inputFilter: KnowledgeFilter,
    inputReportType: KnowledgeReportTypeFilter,
    inputPriority: KnowledgePriorityFilter,
  ) => {
    if (!open) return
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
          limit: 20,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || t("searchFailed"))
      const nextResults = Array.isArray(data?.results) ? data.results : []
      setResults(nextResults)
      if (inputQuery.trim().length >= 2) {
        trackEvent("knowledge_reuse_search_used", safeMetadata(location, plan, {
          queryLength: inputQuery.trim().length,
          resultCount: nextResults.length,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("searchFailed"))
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [location, open, plan, t])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      void loadKnowledge(query, filter, reportType, priority)
    }, queryLength >= 2 ? 250 : 0)
    return () => clearTimeout(timer)
  }, [filter, loadKnowledge, open, priority, query, queryLength, reportType])

  const resultCount = results.length
  const activeFilterCount = useMemo(
    () => [filter !== "all", reportType !== "all", priority !== "all"].filter(Boolean).length,
    [filter, priority, reportType],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-full gap-0 overflow-hidden p-0 sm:max-w-2xl" side="right">
        <SheetHeader className="border-b bg-white p-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="size-4" />
            </div>
            <div>
              <SheetTitle>{t("reuseTitle")}</SheetTitle>
              <SheetDescription>
                {t("reuseDesc")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="border-b bg-white p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-9 pl-8 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <FilterButton
                key={item}
                active={filter === item}
                onClick={() => setFilter(item)}
              >
                {t(filterKeys[item])}
              </FilterButton>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {reportTypeFilters.map((item) => (
              <FilterButton
                key={item}
                active={reportType === item}
                onClick={() => setReportType(item)}
              >
                {t(reportTypeFilterKeys[item])}
              </FilterButton>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {priorityFilters.map((item) => (
              <FilterButton
                key={item}
                active={priority === item}
                onClick={() => setPriority(item)}
              >
                {t(priorityFilterKeys[item])}
              </FilterButton>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("copyOnly")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{t("loadingAssets")}</div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border bg-white px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-slate-100">
                <BookOpen className="size-5 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {hasSearchContext ? t("noMatching") : t("noReusable")}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {hasSearchContext
                  ? t("tryDifferent")
                  : t("willAppear")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{t("reusableResults", { count: resultCount })}</span>
                {activeFilterCount > 0 && <span>{t("activeFilters", { count: activeFilterCount })}</span>}
              </div>
              {results.map((entry) => (
                <KnowledgeReuseCard
                  key={entry.id}
                  entry={entry}
                  location={location}
                  plan={plan}
                  resultCount={resultCount}
                  queryLength={queryLength}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
