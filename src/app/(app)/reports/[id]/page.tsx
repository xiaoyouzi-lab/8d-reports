"use client"

import { useState, useEffect, useCallback, use, useMemo, useRef } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Save,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ReportStepsNav } from "@/components/report/ReportStepsNav"
import { StepForm } from "@/components/report/StepForm"
import { ExportMenu } from "@/components/report/ExportMenu"
import { ShareDialog } from "@/components/report/ShareDialog"
import { AiReportTools } from "@/components/report/AiReportTools"
import { ReportWorkflowPanel } from "@/components/report/ReportWorkflowPanel"
import { STEPS, DEFAULT_REPORT_DATA, getCompletedStepIds, getReportCompletionIssues, type ReportData } from "@/lib/report-steps"
import { authClient } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"
import { usePlan } from "@/lib/use-plan"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
}

const STATUS_KEY = { draft: "draft", in_progress: "inProgress", completed: "completed" } as const
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function formatDefaultReportNumber(createdAt: string | Date | null | undefined, sequence: unknown) {
  const date = createdAt ? new Date(createdAt) : new Date()
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date
  const y = safeDate.getFullYear()
  const m = String(safeDate.getMonth() + 1).padStart(2, "0")
  const d = String(safeDate.getDate()).padStart(2, "0")
  const n = typeof sequence === "number" && Number.isFinite(sequence) ? sequence : 1
  return `${y}-${m}-${d}-${String(n).padStart(3, "0")}`
}

function normalizeReportNumber(
  value: unknown,
  createdAt: string | Date | null | undefined,
  sequence: unknown,
) {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed && !UUID_PATTERN.test(trimmed)) {
      const twoDigitMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})$/)
      if (twoDigitMatch) return `${twoDigitMatch[1]}-0${twoDigitMatch[2]}`
      return trimmed
    }
  }
  return formatDefaultReportNumber(createdAt, sequence)
}

export default function ReportEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: reportId } = use(params)
  const { data: session } = authClient.useSession()
  const { plan, isPro, entitlements } = usePlan((session?.user as Record<string, unknown>)?.plan)
  const te = useTranslations("editor")
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [reportData, setReportData] = useState<ReportData>({
    ...DEFAULT_REPORT_DATA,
  })
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [reportTitle, setReportTitle] = useState("Untitled Report")
  const [logoUrl, setLogoUrl] = useState<string | null>(
    ((session?.user as Record<string, unknown>)?.logoUrl as string | undefined) ?? null,
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [workflowStatus, setWorkflowStatus] = useState("draft")
  const [revision, setRevision] = useState(0)
  const [reportPermissions, setReportPermissions] = useState({
    canExportWithoutWatermark: false,
    canExportWord: false,
    canUseLogo: false,
    canUseEditableShare: false,
    locked: false,
    canEdit: false,
    canManageWorkflow: false,
    canShare: false,
    canExportDraft: false,
  })

  useEffect(() => {
    const sessionLogo = (session?.user as Record<string, unknown> | undefined)?.logoUrl
    if (typeof sessionLogo !== "string") return
    const timer = setTimeout(() => setLogoUrl(sessionLogo), 0)
    return () => clearTimeout(timer)
  }, [session])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/${reportId}`)
        if (res.status === 401) {
          window.location.href = `/login?callbackUrl=${encodeURIComponent(`/reports/${reportId}`)}`
          return
        }
        if (res.status === 404) {
          setLoadError("Report not found, or you do not have access to it.")
          return
        }
        if (!res.ok) {
          setLoadError("We could not load this report. Please try again.")
          return
        }
        const row = await res.json()
        if (row.permissions && typeof row.permissions === "object") {
          setReportPermissions({
            canExportWithoutWatermark: Boolean(row.permissions.canExportWithoutWatermark),
            canExportWord: Boolean(row.permissions.canExportWord),
            canUseLogo: Boolean(row.permissions.canUseLogo),
            canUseEditableShare: Boolean(row.permissions.canUseEditableShare),
            locked: Boolean(row.permissions.locked),
            canEdit: Boolean(row.permissions.canEdit),
            canManageWorkflow: Boolean(row.permissions.canManageWorkflow),
            canShare: Boolean(row.permissions.canShare),
            canExportDraft: Boolean(row.permissions.canExportDraft),
          })
        }
        setWorkflowStatus(row.workflowStatus || "draft")
        setRevision(Number(row.revision) || 0)
        setReportTitle(row.title || "Untitled Report")
        if (row.data && typeof row.data === "object") {
          const rowData = row.data as Partial<ReportData>
          setReportData((prev) => ({
            ...prev,
            ...rowData,
            reportNumber: normalizeReportNumber(rowData.reportNumber, row.createdAt, row.reportNumber),
            reportType: row.reportType || prev.reportType,
            priority: row.priority || prev.priority,
          }))
        }
      } catch {
        setLoadError("We could not load this report. Please check your connection and try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reportId])

  const completedSteps = useMemo(() => new Set(getCompletedStepIds(reportData)), [reportData])

  const status = completedSteps.size === STEPS.length
    ? "completed"
    : completedSteps.size > 0
      ? "in_progress"
      : "draft"

  const currentStep = STEPS[activeStepIndex]
  const readOnlyReason = reportPermissions.locked
    ? "This report is locked. The owner must unlock it for revision before changes can be made."
    : "You have view-only access to this report."

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (!reportPermissions.canEdit) return
    setReportData((prev) => ({ ...prev, [name]: value }))
  }, [reportPermissions.canEdit])

  const saveToServer = useCallback(async (data: ReportData, steps: Set<string>, title: string) => {
    const stepStatusObj: Record<string, boolean> = {}
    for (const stepId of steps) stepStatusObj[stepId] = true
    const res = await fetch(`/api/reports/${reportId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data,
        stepStatus: stepStatusObj,
        title,
        status: steps.size === STEPS.length ? "completed" : steps.size > 0 ? "in_progress" : "draft",
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error(err.error || `Save failed (${res.status})`)
    }
    return res.json()
  }, [reportId])

  const handleSave = async () => {
    if (!reportPermissions.canEdit) {
      toast.error(reportPermissions.locked ? "This report is locked" : "You do not have permission to edit this report")
      return
    }
    const currentCompletedSteps = new Set(getCompletedStepIds(reportData))
    setSaving(true)
    try {
      await saveToServer(reportData, currentCompletedSteps, reportTitle)
      trackEvent("report_saved", { plan, completedSteps: currentCompletedSteps.size }, reportId)
      toast.success("Report saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const next = new Set(getCompletedStepIds(reportData))
    trackEvent("step_changed", { from: currentStep.id, direction: "next", plan }, reportId)
    if (reportPermissions.canEdit) {
      try {
        await saveToServer(reportData, next, reportTitle)
        trackEvent("report_saved", { plan, completedSteps: next.size, auto: true }, reportId)
      } catch { /* silently fail — explicit save handles errors */ }
    }
    if (activeStepIndex < STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (activeStepIndex > 0) {
      trackEvent("step_changed", { from: currentStep.id, direction: "previous", plan }, reportId)
      setActiveStepIndex(activeStepIndex - 1)
    }
  }

  const handleStepClick = (index: number) => {
    trackEvent("step_changed", { from: currentStep.id, to: STEPS[index]?.id, direction: "nav", plan }, reportId)
    setActiveStepIndex(index)
  }

  const handleLogoClick = () => {
    if (!entitlements.companyLogo && !reportPermissions.canUseLogo) {
      trackEvent("logo_upload_gate_clicked", { plan: "free" }, reportId)
      toast("Company logo is a Pro or Team feature", {
        description: "Upgrade to add your company logo to exports.",
        action: {
          label: "Upgrade",
          onClick: () => {
            trackEvent("upgrade_clicked", { source: "logo_upload_gate", plan: "free" }, reportId)
            window.location.href = "/pricing"
          },
        },
      })
      return
    }
    logoInputRef.current?.click()
  }

  const handleLogoFile = async (file: File) => {
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/profile/logo", { method: "POST", body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Logo upload failed")
      }
      const data = await res.json()
      setLogoUrl(data.logoUrl || null)
      toast.success(te("logoUploaded"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logo upload failed")
    } finally {
      setUploadingLogo(false)
    }
  }

  const validateCompletion = () => {
    const issues = getReportCompletionIssues(reportData)
    if (issues.length === 0) return true

    toast.error("Complete key report fields before closing", {
      description: issues.slice(0, 4).join("; ") + (issues.length > 4 ? `; +${issues.length - 4} more` : ""),
    })
    return false
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#F8F9FB]">
        <div className="text-sm text-muted-foreground">{te("loadingReport")}</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#F8F9FB] px-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Report unavailable</h1>
              <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Back to dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
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
              <span className="hidden sm:inline">{te("back")}</span>
            </Link>

            <span className="hidden h-4 w-px bg-border sm:block" />

            <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
              {reportData.reportNumber || reportId.slice(0, 8)}
            </span>

            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              readOnly={!reportPermissions.canEdit}
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
              {te(STATUS_KEY[status] || "draft")}
            </Badge>

            {reportPermissions.canEdit && (
              <AiReportTools
                reportId={reportId}
                reportData={reportData}
                onApplyDraft={(fields) => {
                  if (!reportPermissions.canEdit) {
                    toast.error(readOnlyReason)
                    return
                  }
                  setReportData((prev) => {
                    const next = { ...prev }
                    for (const [key, value] of Object.entries(fields)) {
                      if (!value) continue
                      if (String(next[key as keyof ReportData] || "").trim()) continue
                      next[key as keyof ReportData] = String(value)
                    }
                    return next
                  })
                }}
              />
            )}

            <ReportWorkflowPanel
              reportId={reportId}
              workflowStatus={workflowStatus}
              revision={revision}
              locked={reportPermissions.locked}
              canManageWorkflow={reportPermissions.canManageWorkflow}
              onUpdated={(report) => {
                setWorkflowStatus(report.workflowStatus)
                setRevision(report.revision)
                const locked = Boolean(report.lockedAt)
                setReportPermissions((prev) => ({ ...prev, locked, canEdit: !locked && prev.canManageWorkflow }))
              }}
            />

            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleLogoFile(file)
                event.target.value = ""
              }}
            />

            {reportPermissions.canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogoClick}
                disabled={uploadingLogo}
                className="hidden md:inline-flex"
              >
                <Upload className="size-3.5" />
                Logo
              </Button>
            )}

            {reportPermissions.canShare && (
              <ShareDialog
                reportId={reportId}
                reportTitle={reportTitle}
                isPro={reportPermissions.canUseEditableShare || entitlements.editableShare}
              />
            )}

            {reportPermissions.canExportDraft && (
              <ExportMenu
                reportData={reportData}
                reportTitle={reportTitle}
                reportId={reportId}
                withWatermark={!reportPermissions.canExportWithoutWatermark}
                canExportWord={reportPermissions.canExportWord}
                logoUrl={logoUrl}
              />
            )}

            {reportPermissions.canEdit ? (
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="size-3.5" />
                <span className="hidden sm:inline">{saving ? te("saving") : te("save")}</span>
              </Button>
            ) : (
              <Badge variant="outline" className="hidden border-slate-300 bg-slate-50 text-slate-600 sm:inline-flex">
                {reportPermissions.locked ? "Locked" : "View only"}
              </Badge>
            )}
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
              {!reportPermissions.canEdit && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
                  {readOnlyReason}
                </div>
              )}
              <Card className={cn(!reportPermissions.canEdit && "bg-slate-50/60")}>
                <CardContent className="p-5 lg:p-6">
                  <StepForm
                    step={currentStep}
                    data={reportData}
                    onChange={handleFieldChange}
                    reportId={reportId}
                    isPro={isPro}
                    canEdit={reportPermissions.canEdit}
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
                {te("previous")}
              </Button>

              <div className="flex items-center gap-2">
                {reportPermissions.canEdit ? (
                  <Button variant="outline" onClick={handleSave} disabled={saving}>
                    <Save className="size-3.5" />
                    {te("saveDraft")}
                  </Button>
                ) : (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {reportPermissions.locked ? "Locked report" : "View-only role"}
                  </span>
                )}

                <Button
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={handleNext}
                  disabled={activeStepIndex === STEPS.length - 1}
                >
                  {te("next")}
                  <ChevronRight className="size-4" />
                </Button>

                {activeStepIndex === STEPS.length - 1 && reportPermissions.canEdit && (
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={async () => {
                      if (!validateCompletion()) return
                      const next = new Set(STEPS.map((step) => step.id))
                      setSaving(true)
                      try {
                        await saveToServer(reportData, next, reportTitle)
                        trackEvent("report_saved", { plan, completedSteps: next.size, completed: true }, reportId)
                        toast.success(te("reportSaved"))
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : te("saveFailed"))
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving || !reportPermissions.canEdit}
                  >
                    {te("completeReport")}
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
