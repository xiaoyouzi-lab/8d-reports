"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuotaIndicator } from "@/components/report/QuotaIndicator"
import { CheckoutButton } from "@/components/CheckoutButton"
import { authClient } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"
import { usePlan } from "@/lib/use-plan"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  title: string
  status: string
  reportType: string
  priority: string
  source: string | null
  updatedAt: string
  matchSnippet?: string
}

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
}

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
}

const priorityLabel: Record<string, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-emerald-600",
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { plan, isPro } = usePlan((session?.user as Record<string, unknown>)?.plan)

  const [reports, setReports] = useState<Report[]>([])
  const [searchResults, setSearchResults] = useState<Report[] | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports")
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    const timer = setTimeout(() => {
      void fetchReports()
    }, 0)
    return () => clearTimeout(timer)
  }, [session, fetchReports])

  const totalReports = reports.length
  const inProgress = reports.filter((r) => r.status !== "completed").length
  const completed = reports.filter((r) => r.status === "completed").length
  const normalizedQuery = query.trim().toLowerCase()
  const freeVisibleReports = normalizedQuery
    ? reports.filter((report) => {
        return [
          report.id,
          report.title,
          report.status,
          report.priority,
          report.source ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      })
    : reports
  const visibleReports = isPro && searchResults ? searchResults : freeVisibleReports

  useEffect(() => {
    if (!session || !normalizedQuery) {
      const timer = setTimeout(() => setSearchResults(null), 0)
      return () => clearTimeout(timer)
    }

    if (!isPro) {
      const timer = setTimeout(() => {
        trackEvent("dashboard_search_used", { queryLength: normalizedQuery.length, plan })
        setSearchResults(null)
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      trackEvent("dashboard_search_used", { queryLength: normalizedQuery.length, plan })
      setSearching(true)
      fetch(`/api/reports/search?q=${encodeURIComponent(normalizedQuery)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setSearchResults(data)
          if (Array.isArray(data) && data.length === 0) {
            trackEvent("search_no_results", { queryLength: normalizedQuery.length, plan })
          }
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [isPro, normalizedQuery, plan, session])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split("T")[0]
    } catch {
      return dateStr
    }
  }

  async function createSampleReport() {
    setSampleLoading(true)
    try {
      const res = await fetch("/api/reports/sample", { method: "POST" })
      if (res.ok) {
        const report = await res.json()
        trackEvent("report_created", { source: "sample", plan }, report.id)
        router.push(`/reports/${report.id}`)
      }
    } catch {
      // ignore
    } finally {
      setSampleLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              My Reports
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quality issue tracking & 8D problem solving
            </p>
          </div>
          {!isPro && (
            <div className="flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 sm:w-72">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-950">Upgrade to Pro</p>
                  <p className="text-xs text-indigo-700">
                    Unlimited reports, no watermarks, Word export, and deep search.
                  </p>
                </div>
              </div>
              <CheckoutButton planType="monthly" size="sm" className="h-8 bg-indigo-600 text-white hover:bg-indigo-700">
                Start Pro monthly
              </CheckoutButton>
              <Link href="/pricing" className="text-center text-xs font-medium text-indigo-700 underline underline-offset-4">
                View all plans
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              Total Reports
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground font-mono">
              {loading ? "—" : totalReports}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              In Progress
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-amber-600 font-mono">
              {loading ? "—" : inProgress}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              Completed
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 font-mono">
              {loading ? "—" : completed}
            </span>
          </CardContent>
        </Card>

        <QuotaIndicator isPro={isPro} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="h-9 pl-8 text-sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Link href="/reports/new">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Report</span>
          </Button>
        </Link>
      </div>

      {normalizedQuery && !isPro && (
        <button
          type="button"
          onClick={() => {
            trackEvent("deep_search_gate_clicked", { queryLength: normalizedQuery.length, plan })
            trackEvent("upgrade_clicked", { source: "deep_search_gate", plan })
            router.push("/pricing")
          }}
          className="mb-4 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-xs text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          Upgrade to search problem descriptions, root causes, corrective actions, and historical reports.
        </button>
      )}

      {normalizedQuery && isPro && searching && (
        <div className="mb-4 text-xs text-muted-foreground">Searching report history...</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-8">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-100">
              <FileText className="size-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Welcome to 8D Reports</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first 8D report, or explore a pre-filled sample to see how it works.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/reports/new">
                <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Plus className="size-4" />
                  Create your first report
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={createSampleReport}
                disabled={sampleLoading}
              >
                {sampleLoading ? "Creating..." : "See a sample report"}
              </Button>
            </div>
          </div>

          <div className="w-full max-w-lg rounded-lg border bg-card p-5">
            <h4 className="mb-4 text-sm font-semibold text-foreground">How it works</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                <span className="text-sm text-muted-foreground">
                  Create a report — start a new 8D report or use a template
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">2</span>
                <span className="text-sm text-muted-foreground">
                  Fill each D-step — work through D1 to D8 with guided forms
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">3</span>
                <span className="text-sm text-muted-foreground">
                  Export PDF — generate a professional PDF report in one click
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">4</span>
                <span className="text-sm text-muted-foreground">
                  Share with your customer — send a secure link or the PDF
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {visibleReports.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No reports match your search.
            </div>
          ) : (
            <>
          <div className="hidden lg:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[160px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Report ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Priority
                    </TableHead>
                    <TableHead className="w-[130px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleReports.map((report) => (
                    <TableRow key={report.id} className="group">
                      <TableCell className="py-3 font-mono text-xs font-medium text-muted-foreground">
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-indigo-600 hover:underline"
                          onClick={() => trackEvent("search_result_clicked", { plan, hasQuery: Boolean(normalizedQuery) }, report.id)}
                        >
                          {report.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-sm font-medium text-foreground hover:text-indigo-600"
                          onClick={() => trackEvent("search_result_clicked", { plan, hasQuery: Boolean(normalizedQuery) }, report.id)}
                        >
                          {report.title}
                        </Link>
                        {report.matchSnippet && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {report.matchSnippet}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={cn(
                            "ring-1 ring-inset",
                            statusStyles[report.status] || statusStyles.draft
                          )}
                          variant="outline"
                        >
                          {statusLabel[report.status] || report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-block size-2 rounded-full",
                              priorityDot[report.priority] || priorityDot.medium
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              priorityLabel[report.priority] || priorityLabel.medium
                            )}
                          >
                            {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right text-sm text-muted-foreground">
                        {formatDate(report.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {visibleReports.map((report) => (
              <Link
                href={`/reports/${report.id}`}
                key={report.id}
                onClick={() => trackEvent("search_result_clicked", { plan, hasQuery: Boolean(normalizedQuery) }, report.id)}
              >
                <Card className="group cursor-pointer transition-shadow hover:shadow-sm">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-medium text-indigo-600">
                        {report.id.slice(0, 8)}
                      </span>
                      <Badge
                        className={cn(
                          "ring-1 ring-inset",
                          statusStyles[report.status] || statusStyles.draft
                        )}
                        variant="outline"
                      >
                        {statusLabel[report.status] || report.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {report.title}
                    </span>
                    {report.matchSnippet && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {report.matchSnippet}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-block size-2 rounded-full", priorityDot[report.priority] || priorityDot.medium)} />
                        <span className={cn("text-sm font-medium", priorityLabel[report.priority] || priorityLabel.medium)}>
                          {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(report.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
