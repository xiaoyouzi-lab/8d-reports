"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowRight, FileText, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { usePlan } from "@/lib/use-plan"

const reportTypeLabels: Record<string, string> = {
  customer_8d: "Customer 8D",
  internal_8d: "Internal 8D",
}

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

export default function NewReportPage() {
  const t = useTranslations("editor")
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { entitlements } = usePlan((session?.user as Record<string, unknown>)?.plan)
  const [reportType, setReportType] = useState("customer_8d")
  const [priority, setPriority] = useState("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quota, setQuota] = useState<{ totalQuota: number; usedQuota: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/quota")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setQuota(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const quotaExhausted = !entitlements.unlimitedReports
    && quota !== null
    && quota.usedQuota >= quota.totalQuota

  const handleStart = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, priority }),
      })
      if (res.status === 403) {
        trackEvent("quota_limit_seen", { source: "new_report" })
        toast.error(t("quotaExhausted"))
        setIsSubmitting(false)
        return
      }
      if (!res.ok) {
        toast.error(t("createFailed"))
        setIsSubmitting(false)
        return
      }
      const report = await res.json()
      trackEvent("report_created", { reportType, priority }, report.id)
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
          {t("reportDetailsDesc")}
        </p>
      </div>

      {quotaExhausted ? (
        <Card className="border-indigo-200 bg-indigo-50/70">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-white text-indigo-600">
              <Lock className="size-5" />
            </div>
            <CardTitle>Free report limit reached</CardTitle>
            <CardDescription>
              You have used {quota.usedQuota} of {quota.totalQuota} free reports. Upgrade to Pro or Team to create more reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/pricing" className="inline-flex h-10 w-full items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
              View upgrade options
            </Link>
            <Link href="/dashboard" className="inline-flex h-10 w-full items-center justify-center rounded-md border border-indigo-200 bg-white px-4 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>{t("reportDetails")}</CardTitle>
          <CardDescription>
            {t("reportDetailsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              {t("reportType")}
              <span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Select value={reportType} onValueChange={(val) => setReportType(val ?? "customer_8d")}>
              <SelectTrigger className="w-full">
                <SelectValue className="sr-only" />
                <span>{reportTypeLabels[reportType] || "Customer 8D"}</span>
              </SelectTrigger>
              <SelectContent align="start" sideOffset={8} className="max-h-60 z-[100]">
                <SelectItem value="customer_8d">Customer 8D</SelectItem>
                <SelectItem value="internal_8d">Internal 8D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              {t("priority")}
              <span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={(val) => setPriority(val ?? "medium")}>
              <SelectTrigger className="w-full">
                <SelectValue className="sr-only" />
                <span>{priorityLabels[priority] || "Medium"}</span>
              </SelectTrigger>
              <SelectContent align="start" sideOffset={8} className="max-h-60 z-[100]">
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
            {isSubmitting ? t("starting") : t("startReport")}
            {!isSubmitting && <ArrowRight className="size-4" />}
          </Button>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
