"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STEPS, type ReportData, DEFAULT_REPORT_DATA } from "@/lib/report-steps"

interface ShareResponse {
  share: {
    accessToken: string
    views: number
    createdAt: string
  }
  report: {
    id: string
    title: string
    data: Record<string, unknown>
    stepStatus: Record<string, boolean> | null
    reportType: string
    priority: string
    source: string | null
    createdAt: string
  }
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<{
    reportId: string
    data: ReportData
    title: string
    createdAt: string
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    fetch(`/api/share/${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((share: ShareResponse | null) => {
        if (!share) {
          setReport(null)
          return
        }
        setReport({
          reportId: share.report.id,
          title: share.report.title,
          createdAt: share.report.createdAt,
          data: {
            ...DEFAULT_REPORT_DATA,
            reportNumber: share.report.id,
            reportType: share.report.reportType || DEFAULT_REPORT_DATA.reportType,
            priority: share.report.priority || DEFAULT_REPORT_DATA.priority,
            ...(share.report.data as Record<string, unknown>),
          } as ReportData,
        })
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false))
  }, [token])

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FB] px-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
          <ExternalLink className="size-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Report not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This share link may have been deleted or is no longer available.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Go to 8D Reports
        </Link>
      </div>
    )
  }

  const { data, title, reportId } = report

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <header className="border-b border-border/40 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              8D
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              8D Reports
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Shared Report
            </Badge>
            <Link
              href={`/reports/${reportId}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Edit Report
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-xs font-semibold text-indigo-600">
              {reportId.slice(0, 8)}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {STEPS.map((step) => {
            const isExpanded = expandedStep === step.id
            const hasContent = step.fields.some((field) => {
              const val = data[field.name as keyof ReportData]
              return val && String(val).trim() !== ""
            })

            return (
              <Card key={step.id}>
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() =>
                    setExpandedStep(isExpanded ? null : step.id)
                  }
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">
                      {step.label}
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                  {hasContent && (
                    <Badge
                      variant="outline"
                      className="shrink-0 bg-emerald-50 text-emerald-700 text-[10px]"
                    >
                      Filled
                    </Badge>
                  )}
                </button>

                {isExpanded && (
                  <CardContent className="border-t px-4 py-4">
                    {step.fields.some((field) => {
                      const val = data[field.name as keyof ReportData]
                      return val && String(val).trim() !== ""
                    }) ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {step.fields.map((field) => {
                          const val = data[field.name as keyof ReportData]
                          if (!val || String(val).trim() === "") return null
                          return (
                            <div
                              key={field.name}
                              className={cn(
                                (field.type === "textarea") &&
                                  "sm:col-span-2"
                              )}
                            >
                              <span className="block text-xs font-medium text-muted-foreground">
                                {field.label}
                              </span>
                              <span className="mt-0.5 block text-sm text-foreground whitespace-pre-wrap">
                                {String(val)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="py-2 text-center text-sm text-muted-foreground">
                        No data filled for this step.
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      <footer className="border-t border-border/40 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-4">
          <span className="text-xs text-muted-foreground">
            Powered by
          </span>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <div className="flex size-4 items-center justify-center rounded bg-indigo-600 text-[8px] font-bold text-white">
              8D
            </div>
            8D Reports
          </Link>
        </div>
      </footer>
    </div>
  )
}
