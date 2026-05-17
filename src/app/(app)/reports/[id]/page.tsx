"use client"

import { useState, useEffect, useCallback, use, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ReportStepsNav } from "@/components/report/ReportStepsNav"
import { StepForm } from "@/components/report/StepForm"
import { ExportButton } from "@/components/report/ExportButton"
import { ShareDialog } from "@/components/report/ShareDialog"
import { incrementQuotaUsed } from "@/components/report/QuotaIndicator"
import { STEPS, DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const STORAGE_PREFIX = "report_data_"
const STEPS_STORAGE_PREFIX = "report_steps_"

function loadReportData(reportId: string): ReportData {
  if (typeof window === "undefined") return { ...DEFAULT_REPORT_DATA, reportNumber: reportId }
  try {
    const metaStr = localStorage.getItem(`report_${reportId}_meta`)
    const meta = metaStr ? JSON.parse(metaStr) : null
    const savedStr = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`)
    const saved = savedStr ? JSON.parse(savedStr) : {}

    return {
      ...DEFAULT_REPORT_DATA,
      reportNumber: reportId,
      reportType: meta?.reportType ?? DEFAULT_REPORT_DATA.reportType,
      priority: meta?.priority ?? DEFAULT_REPORT_DATA.priority,
      ...saved,
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_REPORT_DATA, reportNumber: reportId }
}

function loadCompletedSteps(reportId: string): Set<string> {
  if (typeof window === "undefined") return new Set<string>()
  try {
    const saved = localStorage.getItem(`${STEPS_STORAGE_PREFIX}${reportId}`)
    if (saved) {
      return new Set(JSON.parse(saved))
    }
  } catch {
    // ignore
  }
  return new Set<string>()
}

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
}

export default function ReportEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: reportId } = use(params)
  const { data: session } = authClient.useSession()
  const plan = (session?.user as Record<string, unknown>)?.plan as string || "free"
  const isPro = plan === "pro"
  const hasConsumedQuotaRef = useRef(false)

  const [reportData, setReportData] = useState<ReportData>(() =>
    loadReportData(reportId),
  )
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() =>
    loadCompletedSteps(reportId),
  )
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [reportTitle, setReportTitle] = useState("Untitled Report")

  const status = completedSteps.size === STEPS.length ? "completed" : completedSteps.size > 0 ? "in_progress" : "draft"

  const currentStep = STEPS[activeStepIndex]

  const handleFieldChange = useCallback((name: string, value: string) => {
    setReportData((prev) => ({ ...prev, [name]: value }))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(
        `${STORAGE_PREFIX}${reportId}`,
        JSON.stringify(reportData),
      )
      localStorage.setItem(
        `${STEPS_STORAGE_PREFIX}${reportId}`,
        JSON.stringify(Array.from(completedSteps)),
      )
    }, 10000)
    return () => clearInterval(interval)
  }, [reportId, reportData, completedSteps])

  const handleSave = () => {
    localStorage.setItem(
      `${STORAGE_PREFIX}${reportId}`,
      JSON.stringify(reportData),
    )
    localStorage.setItem(
      `${STEPS_STORAGE_PREFIX}${reportId}`,
      JSON.stringify(Array.from(completedSteps)),
    )
  }

  const handleMarkStepComplete = () => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(currentStep.id)
      return next
    })
  }

  const handleNext = () => {
    handleMarkStepComplete()
    if (activeStepIndex < STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1)
    }
  }

  const handleStepClick = (index: number) => {
    setActiveStepIndex(index)
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#F8F9FB]">
      <div className="sticky top-14 z-30 border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex h-12 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <span className="hidden h-4 w-px bg-border sm:block" />

            <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
              {reportId}
            </span>

            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="min-w-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Untitled Report"
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "hidden ring-1 ring-inset sm:inline-flex",
                statusStyles[status],
              )}
              variant="outline"
            >
              {status === "draft" ? "Draft" : status === "in_progress" ? "In Progress" : "Completed"}
            </Badge>

            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              <Eye className="size-3.5" />
              Preview
            </Button>

            <ShareDialog reportId={reportId} reportTitle={reportTitle} />

            <ExportButton
              reportData={reportData}
              reportTitle={reportTitle}
              reportId={reportId}
              withWatermark={!isPro}
            />

            <Button
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleSave}
            >
              <Save className="size-3.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="hidden lg:block shrink-0 border-r border-border/40 bg-white px-3 pt-4">
          <ReportStepsNav
            steps={STEPS}
            activeStepIndex={activeStepIndex}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="lg:hidden border-b border-border/40 bg-white px-4 pt-3">
            <ReportStepsNav
              steps={STEPS}
              activeStepIndex={activeStepIndex}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
            <div className="mx-auto max-w-3xl">
              <Card>
                <CardContent className="p-5 lg:p-6">
                  <StepForm
                    step={currentStep}
                    data={reportData}
                    onChange={handleFieldChange}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex items-center justify-between px-4 py-3 lg:px-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={activeStepIndex === 0}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleSave}>
                  <Save className="size-3.5" />
                  Save Draft
                </Button>

                <Button
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={handleNext}
                  disabled={activeStepIndex === STEPS.length - 1}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>

                {activeStepIndex === STEPS.length - 1 && (
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      handleMarkStepComplete()
                      handleSave()
                      if (!hasConsumedQuotaRef.current && plan !== "pro" && session?.user?.id) {
                        hasConsumedQuotaRef.current = true
                        incrementQuotaUsed(session.user.id)
                      }
                    }}
                  >
                    Complete Report
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
