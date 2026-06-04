"use client"

import { useState, useRef, useEffect } from "react"
import { FileDown, FileText, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { exportReportToPdf } from "@/lib/pdf-export"
import { createExportZip, downloadBlob } from "@/lib/export-zip"
import { useTranslations } from "next-intl"
import { getReportCompletionIssues, type ReportData } from "@/lib/report-steps"
import { trackEvent } from "@/lib/analytics"

interface ExportAttachment {
  id: string
  url: string
  filename: string
  fileType: string
  mimeType?: string | null
  stepId?: string | null
}

function getAttachmentFileUrl(att: ExportAttachment): string {
  return `/api/attachments/${att.id}/file`
}

interface ExportMenuProps {
  reportData: ReportData
  reportTitle: string
  reportId: string
  withWatermark: boolean
  canExportWord?: boolean
  logoUrl?: string | null
}

export function ExportMenu({ reportData, reportTitle, reportId, withWatermark, canExportWord = false, logoUrl }: ExportMenuProps) {
  const t = useTranslations("export")
  const editorT = useTranslations("editor")
  const [loading, setLoading] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/attachments`)
      return res.ok ? (await res.json() as ExportAttachment[]) : []
    } catch { return [] }
  }

  const logExport = (format: "pdf" | "word" | "zip") => {
    void fetch(`/api/reports/${reportId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    })
  }

  const startSingleExportCheckout = async () => {
    setLoading("single_export")
    try {
      trackEvent("checkout_started", { planType: "single_report_export", source: "export_menu" }, reportId)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "single_report_export", reportId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to create checkout session")
      if (!data?.checkout_url) throw new Error("Checkout URL missing")
      window.location.href = data.checkout_url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed")
    } finally {
      setLoading(null)
    }
  }

  const warnIfReportNeedsWork = () => {
    const issues = getReportCompletionIssues(reportData)
    if (issues.length === 0) return

    toast.warning("This report may need more detail before delivery", {
      description: issues.slice(0, 3).join("; ") + (issues.length > 3 ? `; +${issues.length - 3} more` : ""),
    })
  }

  const handleExportPdf = async () => {
    setOpen(false)
    warnIfReportNeedsWork()
    setLoading("pdf")
    try {
      trackEvent("export_clicked", { format: "pdf", plan: withWatermark ? "free" : "pro" }, reportId)
      const allAttachments = (await fetchAttachments()).filter((a) => a.fileType !== "signature")
      const pdf = await exportReportToPdf({
        reportData,
        reportTitle,
        reportId,
        withWatermark,
        logoUrl,
        attachments: allAttachments.map((a) => ({
          url: getAttachmentFileUrl(a),
          filename: a.filename,
          stepId: a.stepId ?? undefined,
          fileType: a.fileType,
          mimeType: a.mimeType,
        })),
      })

      const allAttachForZip = allAttachments.map((a) => ({
        url: getAttachmentFileUrl(a),
        fallbackUrl: a.url,
        filename: a.filename,
      }))
      if (allAttachForZip.length > 0) {
        const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
        const zip = await createExportZip(blob, `${reportId.slice(0, 8)}_8D_Report.pdf`, allAttachForZip)
        downloadBlob(zip, `${reportId.slice(0, 8)}_8D.zip`)
        logExport("zip")
      } else {
        pdf.save(`${reportId.slice(0, 8)}_8D_Report.pdf`)
        logExport("pdf")
      }
      trackEvent("export_succeeded", { format: "pdf", plan: withWatermark ? "free" : "pro" }, reportId)
      if (withWatermark) {
        trackEvent("watermark_exported", { format: "pdf", plan: "free" }, reportId)
      }
      toast.success(t("pdfSuccess"))
    } catch {
      toast.error(t("exportFailed"))
    } finally {
      setLoading(null)
    }
  }

  const handleExportDocx = async () => {
    setOpen(false)
    warnIfReportNeedsWork()
    if (withWatermark) {
      trackEvent("word_export_gate_clicked", { plan: "free" }, reportId)
      toast("Word export requires Pro, Team, or a single-report export", {
        description: "Export this report once for $4.99, including Word and no-watermark PDF.",
        action: {
          label: "Export for $4.99",
          onClick: () => {
            trackEvent("upgrade_clicked", { source: "single_export_gate", plan: "free" }, reportId)
            void startSingleExportCheckout()
          },
        },
      })
      return
    }
    if (!canExportWord) {
      toast.error("Word export is not available for this account")
      return
    }
    setLoading("docx")
    try {
      trackEvent("export_clicked", { format: "docx", plan: "pro" }, reportId)
      const res = await fetch(`/api/reports/${reportId}/export/docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: withWatermark ? "free" : "pro",
          logoUrl: logoUrl || null,
          locale: document.cookie.includes("NEXT_LOCALE=zh") ? "zh-CN" : "en",
        }),
      })
      if (!res.ok) throw new Error("Export failed")
      const allAttachments = (await fetchAttachments()).filter((a) => a.fileType !== "signature")
      const allAttachForZip = allAttachments.map((a) => ({
        url: getAttachmentFileUrl(a),
        fallbackUrl: a.url,
        filename: a.filename,
      }))
      if (allAttachForZip.length > 0) {
        const blob = await res.blob()
        const zip = await createExportZip(blob, `${reportId.slice(0, 8)}_8D_Report.docx`, allAttachForZip)
        downloadBlob(zip, `${reportId.slice(0, 8)}_8D.zip`)
        logExport("zip")
      } else {
        const blob = await res.blob()
        downloadBlob(blob, `${reportId.slice(0, 8)}_8D_Report.docx`)
      }
      trackEvent("export_succeeded", { format: "docx", plan: "pro" }, reportId)
      toast.success(t("wordSuccess"))
    } catch {
      toast.error(t("exportFailed"))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        disabled={!!loading}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <FileDown className="size-3.5" />
        <span className="hidden sm:inline ml-0.5">{loading ? "..." : editorT("export")}</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Export Format</div>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <FileText className="size-4" />
            {t("pdf")}
          </button>
          <button
            type="button"
            onClick={handleExportDocx}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <FileSpreadsheet className="size-4" />
            {t("word")}
          </button>
          {withWatermark && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                void startSingleExportCheckout()
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-md bg-indigo-50 px-2 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <FileDown className="size-4" />
              Export this report — $4.99
            </button>
          )}
        </div>
      )}
    </div>
  )
}
