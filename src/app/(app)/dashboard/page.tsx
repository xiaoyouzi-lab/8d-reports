"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter, FileText, CheckCircle2, ArrowRight, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuotaIndicator } from "@/components/report/QuotaIndicator"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  title: string
  status: string
  reportType: string
  priority: string
  source: string | null
  updatedAt: string
}

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
}

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
}

const priorityLabel: Record<string, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-emerald-600",
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id || ""
  const plan = (session?.user as Record<string, unknown>)?.plan as string || "free"
  const isPro = plan === "pro"

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [sampleLoading, setSampleLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports")
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchReports()
  }, [session, fetchReports])

  const totalReports = reports.length
  const inProgress = reports.filter((r) => r.status !== "completed").length
  const completed = reports.filter((r) => r.status === "completed").length

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split("T")[0]
    } catch {
      return dateStr
    }
  }

  async function createSampleReport() {
    setSampleLoading(true)
    try {
      const res = await fetch("/api/reports/sample", { method: "POST" })
      if (res.ok) {
        const report = await res.json()
        router.push(`/reports/${report.id}`)
      }
    } catch {
      // ignore
    } finally {
      setSampleLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quality issue tracking & 8D problem solving
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              Total Reports
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground font-mono">
              {loading ? "—" : totalReports}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              In Progress
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-amber-600 font-mono">
              {loading ? "—" : inProgress}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              Completed
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 font-mono">
              {loading ? "—" : completed}
            </span>
          </CardContent>
        </Card>

        <QuotaIndicator userId={userId} isPro={isPro} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Button variant="outline" size="default">
          <Filter className="size-4" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        <Link href="/reports/new">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Report</span>
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-8">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-100">
              <FileText className="size-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Welcome to 8D Reports</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first 8D report, or explore a pre-filled sample to see how it works.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/reports/new">
                <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Plus className="size-4" />
                  Create your first report
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={createSampleReport}
                disabled={sampleLoading}
              >
                {sampleLoading ? "Creating..." : "See a sample report"}
              </Button>
            </div>
          </div>

          <div className="w-full max-w-lg rounded-lg border bg-card p-5">
            <h4 className="mb-4 text-sm font-semibold text-foreground">How it works</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                <span className="text-sm text-muted-foreground">
                  Create a report — start a new 8D report or use a template
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">2</span>
                <span className="text-sm text-muted-foreground">
                  Fill each D-step — work through D1 to D8 with guided forms
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">3</span>
                <span className="text-sm text-muted-foreground">
                  Export PDF — generate a professional PDF report in one click
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">4</span>
                <span className="text-sm text-muted-foreground">
                  Share with your customer — send a secure link or the PDF
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[160px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Report ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Priority
                    </TableHead>
                    <TableHead className="w-[130px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="group">
                      <TableCell className="py-3 font-mono text-xs font-medium text-muted-foreground">
                        <Link href={`/reports/${report.id}`} className="text-indigo-600 hover:underline">
                          {report.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        <Link href={`/reports/${report.id}`} className="text-sm font-medium text-foreground hover:text-indigo-600">
                          {report.title}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={cn(
                            "ring-1 ring-inset",
                            statusStyles[report.status] || statusStyles.draft
                          )}
                          variant="outline"
                        >
                          {statusLabel[report.status] || report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-block size-2 rounded-full",
                              priorityDot[report.priority] || priorityDot.medium
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              priorityLabel[report.priority] || priorityLabel.medium
                            )}
                          >
                            {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right text-sm text-muted-foreground">
                        {formatDate(report.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {reports.map((report) => (
              <Link href={`/reports/${report.id}`} key={report.id}>
                <Card className="group cursor-pointer transition-shadow hover:shadow-sm">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-medium text-indigo-600">
                        {report.id.slice(0, 8)}
                      </span>
                      <Badge
                        className={cn(
                          "ring-1 ring-inset",
                          statusStyles[report.status] || statusStyles.draft
                        )}
                        variant="outline"
                      >
                        {statusLabel[report.status] || report.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {report.title}
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-block size-2 rounded-full", priorityDot[report.priority] || priorityDot.medium)} />
                        <span className={cn("text-sm font-medium", priorityLabel[report.priority] || priorityLabel.medium)}>
                          {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(report.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
