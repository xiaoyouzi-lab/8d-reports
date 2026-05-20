"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, FileText } from "lucide-react"
import { toast } from "sonner"
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

export default function NewReportPage() {
  const router = useRouter()
  const [reportType, setReportType] = useState("customer_8d")
  const [priority, setPriority] = useState("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStart = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, priority }),
      })
      if (res.status === 403) {
        toast.error("Quota exhausted. Upgrade to Pro to create more reports.")
        setIsSubmitting(false)
        return
      }
      if (!res.ok) {
        toast.error("Failed to create report")
        setIsSubmitting(false)
        return
      }
      const report = await res.json()
      router.push(`/reports/${report.id}`)
    } catch {
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
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
