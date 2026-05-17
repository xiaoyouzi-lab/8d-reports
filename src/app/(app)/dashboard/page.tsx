"use client"

import { Search, Plus, Filter } from "lucide-react"
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

type ReportStatus = "Draft" | "Submitted" | "Completed"
type ReportPriority = "Low" | "Medium" | "High"

interface Report {
  id: string
  title: string
  status: ReportStatus
  priority: ReportPriority
  updated: string
}

const mockReports: Report[] = [
  {
    id: "QR-2025-0003",
    title: "Surface crack on housing part",
    status: "Draft",
    priority: "High",
    updated: "2025-05-15",
  },
  {
    id: "QR-2025-0002",
    title: "Dimensional deviation on assembly line",
    status: "Submitted",
    priority: "Medium",
    updated: "2025-05-14",
  },
  {
    id: "QR-2025-0001",
    title: "Coating thickness out of spec",
    status: "Completed",
    priority: "Low",
    updated: "2025-05-10",
  },
]

const statusStyles: Record<ReportStatus, string> = {
  Draft: "bg-amber-100 text-amber-700 ring-amber-600/20",
  Submitted: "bg-blue-100 text-blue-700 ring-blue-600/20",
  Completed: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
}

const priorityDot: Record<ReportPriority, string> = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
}

const priorityLabel: Record<ReportPriority, string> = {
  High: "text-red-600",
  Medium: "text-amber-600",
  Low: "text-emerald-600",
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id || ""
  const plan = (session?.user as Record<string, unknown>)?.plan as string || "free"
  const isPro = plan === "pro"

  const totalReports = mockReports.length
  const inProgress = mockReports.filter((r) => r.status !== "Completed").length
  const completed = mockReports.filter((r) => r.status === "Completed").length

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
              {totalReports}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              In Progress
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-amber-600 font-mono">
              {inProgress}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 p-4 lg:p-5">
            <span className="text-xs font-medium text-muted-foreground">
              Completed
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 font-mono">
              {completed}
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
              {mockReports.map((report) => (
                <TableRow
                  key={report.id}
                  className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-slate-50"
                >
                  <TableCell className="py-3 font-mono text-xs font-medium text-muted-foreground">
                    {report.id}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm font-medium text-foreground">
                      {report.title}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={cn(
                        "ring-1 ring-inset",
                        statusStyles[report.status]
                      )}
                      variant="outline"
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block size-2 rounded-full",
                          priorityDot[report.priority]
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          priorityLabel[report.priority]
                        )}
                      >
                        {report.priority}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right text-sm text-muted-foreground">
                    {report.updated}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {mockReports.map((report) => (
          <Card key={report.id} className="group cursor-pointer transition-shadow hover:shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {report.id}
                </span>
                <Badge
                  className={cn(
                    "ring-1 ring-inset",
                    statusStyles[report.status]
                  )}
                  variant="outline"
                >
                  {report.status}
                </Badge>
              </div>
              <span className="text-sm font-medium text-foreground">
                {report.title}
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      priorityDot[report.priority]
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      priorityLabel[report.priority]
                    )}
                  >
                    {report.priority}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {report.updated}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
