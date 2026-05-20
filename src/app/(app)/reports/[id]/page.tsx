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
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ReportStepsNav } from "@/components/report/ReportStepsNav"
import { StepForm } from "@/components/report/StepForm"
import { ExportMenu } from "@/components/report/ExportMenu"
import { ShareDialog } from "@/components/report/ShareDialog"
import { STEPS, DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

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

  const [reportData, setReportData] = useState<ReportData>({
    ...DEFAULT_REPORT_DATA,
    reportNumber: reportId,
  })
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [reportTitle, setReportTitle] = useState("Untitled Report")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/${reportId}`)
        if (!res.ok) return
        const row = await res.json()
        setReportTitle(row.title || "Untitled Report")
        if (row.data && typeof row.data === "object") {
          setReportData((prev) => ({
            ...prev,
            ...row.data,
            reportNumber: reportId,
            reportType: row.reportType || prev.reportType,
            priority: row.priority || prev.priority,
          }))
        }
        if (row.stepStatus && typeof row.stepStatus === "object") {
          const completed = new Set<string>()
          for (const [stepId, done] of Object.entries(row.stepStatus)) {
            if (done) completed.add(stepId)
          }
          setCompletedSteps(completed)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reportId])

  const status = completedSteps.size === STEPS.length
    ? "completed"
    : completedSteps.size > 0
      ? "in_progress"
      : "draft"

  const currentStep = STEPS[activeStepIndex]

  const handleFieldChange = useCallback((name: string, value: string) => {
    setReportData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const saveToServer = useCallback(async (data: ReportData, steps: Set<string>, title: string) => {
    const stepStatusObj: Record<string, boolean> = {}
    for (const stepId of steps) stepStatusObj[stepId] = true
    await fetch(`/api/reports/${reportId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data,
        stepStatus: stepStatusObj,
        title,
        status: steps.size === STEPS.length ? "completed" : steps.size > 0 ? "in_progress" : "draft",
      }),
    })
  }, [reportId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveToServer(reportData, completedSteps, reportTitle)
      toast.success("Report saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
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

  const consumeQuota = async () => {
    if (hasConsumedQuotaRef.current || plan === "pro") return
    hasConsumedQuotaRef.current = true
    try {
      await fetch("/api/quota", { method: "POST" })
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#F8F9FB]">
        <div className="text-sm text-muted-foreground">Loading report...</div>
      </div>
    )
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
              {reportId.slice(0, 8)}
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

            <ExportMenu
              reportData={reportData}
              reportTitle={reportTitle}
              reportId={reportId}
              withWatermark={!isPro}
              logoUrl={(session?.user as Record<string, unknown>)?.logoUrl as string || null}
            />

            <Button
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="size-3.5" />
              <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
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
                    reportId={reportId}
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
                <Button variant="outline" onClick={handleSave} disabled={saving}>
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
                      consumeQuota()
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
