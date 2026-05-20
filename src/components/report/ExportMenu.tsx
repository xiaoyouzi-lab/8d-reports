"use client"

import { useState } from "react"
import { FileDown, FileText, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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

  const handleExportPdf = async () => {
    setLoading("pdf")
    try {
      const pdf = exportReportToPdf(reportData, reportTitle, reportId, withWatermark, logoUrl)

      const attachmentsRes = await fetch(`/api/reports/${reportId}/attachments`)
      const allAttachments = attachmentsRes.ok ? await attachmentsRes.json() : []

      if (allAttachments.length > 0) {
        const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
        const zip = await createExportZip(
          blob,
          `${reportId.slice(0, 8)}_8D_Report.pdf`,
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
          blob,
          `${reportId.slice(0, 8)}_8D_Report.docx`,
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={!!loading}>
            <FileDown className="size-3.5" />
            <span className="hidden sm:inline ml-1">{loading ? "..." : editorT("export")}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
          <FileText className="size-4" />
          {t("pdf")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportDocx} className="cursor-pointer">
          <FileSpreadsheet className="size-4" />
          {t("word")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
