"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function generateReportId(): string {
  const num = String(Math.floor(Math.random() * 9000) + 1000)
  return `QR-2025-${num}`
}

export default function NewReportPage() {
  const router = useRouter()
  const [reportType, setReportType] = useState("customer_8d")
  const [priority, setPriority] = useState("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStart = () => {
    setIsSubmitting(true)
    const reportId = generateReportId()
    localStorage.setItem(
      `report_${reportId}_meta`,
      JSON.stringify({ reportType, priority, createdAt: new Date().toISOString() }),
    )
    router.push(`/reports/${reportId}`)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-100">
          <FileText className="size-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New 8D Report
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start a new quality issue investigation using the 8D methodology
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            Choose the type and priority for your 8D report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Report Type
              <span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Select value={reportType} onValueChange={(val) => setReportType(val ?? "customer_8d")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_8d">Customer 8D</SelectItem>
                <SelectItem value="internal_8d">Internal 8D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Priority
              <span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={(val) => setPriority(val ?? "medium")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={handleStart}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting..." : "Start Report"}
            {!isSubmitting && <ArrowRight className="size-4" />}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
