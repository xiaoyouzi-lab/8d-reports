"use client"

import { useEffect, useState } from "react"
import { History, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const STATUSES = [
  ["draft", "Draft"],
  ["internal_review", "Internal Review"],
  ["approved", "Approved"],
  ["submitted", "Submitted to Customer"],
  ["closed", "Closed"],
] as const

interface Activity {
  id: string
  actorName?: string | null
  actionType: string
  fieldName?: string | null
  reason?: string | null
  createdAt: string
  metadata?: Record<string, unknown>
}

export function ReportWorkflowPanel({
  reportId,
  workflowStatus,
  revision,
  locked,
  canManageWorkflow,
  onUpdated,
}: {
  reportId: string
  workflowStatus: string
  revision: number
  locked: boolean
  canManageWorkflow: boolean
  onUpdated: (report: { workflowStatus: string; revision: number; lockedAt?: string | null }) => void
}) {
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch(`/api/reports/${reportId}/activity`).then((res) => res.ok ? res.json() : []).then(setActivities).catch(() => {})
  }, [open, reportId])

  async function updateWorkflow(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Workflow update failed")
      onUpdated(data)
      setReason("")
      const activityRes = await fetch(`/api/reports/${reportId}/activity`)
      if (activityRes.ok) setActivities(await activityRes.json())
      toast.success(body.action === "unlock" ? "Report unlocked for revision" : "Workflow status updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Workflow update failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {locked ? <Lock className="size-3.5" /> : <History className="size-3.5" />}
        <span className="hidden md:inline">Workflow</span>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow and activity</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border bg-slate-50 p-3 text-sm">
          <div className="font-medium">Revision {revision} · {STATUSES.find(([value]) => value === workflowStatus)?.[1] || workflowStatus}</div>
          <div className="mt-1 text-xs text-muted-foreground">{locked ? "Locked against edits, attachment deletion, and signature replacement." : "Open for editing."}</div>
          {canManageWorkflow && !locked && (
            <select
              className="mt-3 h-9 w-full rounded-md border bg-white px-2 text-sm"
              value={workflowStatus}
              disabled={saving}
              onChange={(event) => void updateWorkflow({ workflowStatus: event.target.value })}
            >
              {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          )}
          {canManageWorkflow && locked && (
            <div className="mt-3 grid gap-2">
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for unlocking this report for revision" rows={3} />
              <Button disabled={saving || !reason.trim()} onClick={() => void updateWorkflow({ action: "unlock", reason })}>
                <Unlock className="size-3.5" /> Unlock for revision
              </Button>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Activity log</h3>
          <div className="mt-2 divide-y rounded-lg border">
            {activities.length === 0 && <div className="p-3 text-xs text-muted-foreground">No activity recorded yet.</div>}
            {activities.map((activity) => (
              <div key={activity.id} className="p-3 text-xs">
                <div><span className="font-medium">{activity.actorName || "Team member"}</span> · {activity.actionType.replaceAll("_", " ")}</div>
                <div className="mt-1 text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}{activity.reason ? ` · ${activity.reason}` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
