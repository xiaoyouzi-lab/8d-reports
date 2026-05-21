"use client"

import { useState, useRef, useEffect } from "react"
import { FileDown, FileText, FileSpreadsheet, Check } from "lucide-react"
import { toast } from "sonner"
import { exportReportToPdf } from "@/lib/pdf-export"
import { createExportZip, downloadBlob } from "@/lib/export-zip"
import { useTranslations } from "next-intl"
import type { ReportData } from "@/lib/report-steps"

interface ExportMenuProps {
  reportData: ReportData
  reportTitle: string
  reportId: string
  withWatermark: boolean
  logoUrl?: string | null
}

export function ExportMenu({ reportData, reportTitle, reportId, withWatermark, logoUrl }: ExportMenuProps) {
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

  const handleExportPdf = async () => {
    setOpen(false)
    setLoading("pdf")
    try {
      const pdf = exportReportToPdf(reportData, reportTitle, reportId, withWatermark, logoUrl)
      const attachmentsRes = await fetch(`/api/reports/${reportId}/attachments`)
      const allAttachments = attachmentsRes.ok ? await attachmentsRes.json() : []
      if (allAttachments.length > 0) {
        const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
        const zip = await createExportZip(
          blob, `${reportId.slice(0, 8)}_8D_Report.pdf`,
          allAttachments.map((a: any) => ({ url: a.url, filename: a.filename }))
        )
        downloadBlob(zip, `${reportId.slice(0, 8)}_8D.zip`)
      } else {
        pdf.save(`${reportId.slice(0, 8)}_8D_Report.pdf`)
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
    setLoading("docx")
    try {
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
      const attachmentsRes = await fetch(`/api/reports/${reportId}/attachments`)
      const allAttachments = attachmentsRes.ok ? await attachmentsRes.json() : []
      if (allAttachments.length > 0) {
        const blob = await res.blob()
        const zip = await createExportZip(
          blob, `${reportId.slice(0, 8)}_8D_Report.docx`,
          allAttachments.map((a: any) => ({ url: a.url, filename: a.filename }))
        )
        downloadBlob(zip, `${reportId.slice(0, 8)}_8D.zip`)
      } else {
        const blob = await res.blob()
        downloadBlob(blob, `${reportId.slice(0, 8)}_8D_Report.docx`)
      }
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
        </div>
      )}
    </div>
  )
}
