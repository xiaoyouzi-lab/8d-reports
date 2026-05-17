"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { exportReportToPdf } from "@/lib/pdf-export"
import type { ReportData } from "@/lib/report-steps"

interface ExportButtonProps {
  reportData: ReportData
  reportTitle: string
  reportId: string
  withWatermark: boolean
}

export function ExportButton({
  reportData,
  reportTitle,
  reportId,
  withWatermark,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 100))
    try {
      exportReportToPdf(reportData, reportTitle, reportId, withWatermark)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileDown className="size-3.5" />
      )}
      <span className="hidden sm:inline">Export PDF</span>
    </Button>
  )
}
