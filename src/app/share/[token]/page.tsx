"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, ExternalLink, FileText, Save, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STEPS, type ReportData, DEFAULT_REPORT_DATA } from "@/lib/report-steps"

interface ShareResponse {
  accessToken: string
  views: number
  permissionLevel: string
  createdAt: string
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
  attachments: ShareAttachment[]
}

interface ShareAttachment {
  id: string
  filename: string
  fileType: string
  mimeType?: string | null
  fileSize?: number | null
  stepId?: string | null
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionLevel, setPermissionLevel] = useState("view")
  const [report, setReport] = useState<{
    reportId: string
    data: ReportData
    title: string
    createdAt: string
    attachments: ShareAttachment[]
  } | null>(null)
  const [editData, setEditData] = useState<ReportData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/share/${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((share: ShareResponse | null) => {
        if (!share) {
          setReport(null)
          return
        }
        const data = {
          ...DEFAULT_REPORT_DATA,
          reportNumber: share.report.id,
          reportType: share.report.reportType || DEFAULT_REPORT_DATA.reportType,
          priority: share.report.priority || DEFAULT_REPORT_DATA.priority,
          ...(share.report.data as Record<string, unknown>),
        } as ReportData

        setReport({
          reportId: share.report.id,
          title: share.report.title,
          createdAt: share.report.createdAt,
          data,
          attachments: share.attachments || [],
        })
        setEditData(data)
        setPermissionLevel(share.permissionLevel || "view")
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [token])

  const handleSave = async () => {
    if (!editData || !report) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...editData }
      delete body.reportNumber

      const res = await fetch(`/api/share/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: report.title,
          data: body,
          reportType: editData.reportType,
          priority: editData.priority,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (name: string, value: string) => {
    if (!editData) return
    setEditData({ ...editData, [name]: value })
  }

  if (loading) {
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
  const canEdit = permissionLevel === "edit"
  const displayData = canEdit ? editData || data : data
  const attachmentUrl = (attachmentId: string) => `/api/share/${token}/attachments/${attachmentId}`
  const formatFileSize = (size?: number | null) => {
    if (!size) return ""
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

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
            {canEdit && (
              <Badge className="bg-indigo-100 text-indigo-700 text-xs border-indigo-200">
                Editable
              </Badge>
            )}
          </div>
        </div>
      </header>

      {canEdit && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                You are editing this report — changes will update the original.
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className={saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}
            >
              <Save className="size-3.5" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

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
            const stepAttachments = report.attachments.filter((attachment) => attachment.stepId === step.id)
            const hasContent = step.fields.some((field) => {
              const val = displayData[field.name as keyof ReportData]
              return val && String(val).trim() !== ""
            }) || stepAttachments.length > 0

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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {step.fields.map((field) => {
                        const val = displayData[field.name as keyof ReportData]
                        if (canEdit) {
                          if (field.type === "textarea") {
                            return (
                              <div key={field.name} className="sm:col-span-2">
                                <span className="block text-xs font-medium text-muted-foreground mb-1">
                                  {field.label}
                                </span>
                                <textarea
                                  value={String(val || "")}
                                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                  placeholder={field.placeholder}
                                  rows={3}
                                  className="w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                                />
                              </div>
                            )
                          }
                          return (
                            <div key={field.name}>
                              <span className="block text-xs font-medium text-muted-foreground mb-1">
                                {field.label}
                              </span>
                              <input
                                type="text"
                                value={String(val || "")}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                              />
                            </div>
                          )
                        }

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
                    {step.fields.every((field) => {
                      const val = displayData[field.name as keyof ReportData]
                      return !val || String(val).trim() === ""
                    }) && stepAttachments.length === 0 && !canEdit && (
                      <p className="py-2 text-center text-sm text-muted-foreground">
                        No data filled for this step.
                      </p>
                    )}
                    {stepAttachments.length > 0 && (
                      <div className="mt-5 border-t pt-4">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Attachments
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {stepAttachments.map((attachment) => {
                            const isImage = attachment.fileType === "photo" || attachment.mimeType?.startsWith("image/")
                            return (
                              <a
                                key={attachment.id}
                                href={attachmentUrl(attachment.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="overflow-hidden rounded-lg border bg-white transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                              >
                                {isImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={attachmentUrl(attachment.id)}
                                    alt={attachment.filename}
                                    className="aspect-[4/3] w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex aspect-[4/3] items-center justify-center bg-slate-50">
                                    <FileText className="size-8 text-slate-500" />
                                  </div>
                                )}
                                <div className="p-2">
                                  <p className="truncate text-xs font-medium text-foreground">
                                    {attachment.filename}
                                  </p>
                                  {attachment.fileSize && (
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                      {formatFileSize(attachment.fileSize)}
                                    </p>
                                  )}
                                </div>
                              </a>
                            )
                          })}
                        </div>
                      </div>
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
