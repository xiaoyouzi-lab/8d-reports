"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, History, Lock, Unlock } from "lucide-react"
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
  entityType?: string | null
  entityId?: string | null
  fieldName?: string | null
  oldValuePreview?: string | null
  newValuePreview?: string | null
  reason?: string | null
  createdAt: string
  metadata?: Record<string, unknown>
}

const ACTION_LABELS: Record<string, string> = {
  report_field_updated: "Updated report field",
  report_updated: "Updated report details",
  attachment_uploaded: "Uploaded attachment",
  attachment_deleted: "Deleted attachment",
  share_link_created: "Created share link",
  share_link_updated: "Updated share link",
  share_link_revoked: "Revoked share link",
  workflow_status_changed: "Changed workflow status",
  report_approved_or_locked: "Approved / locked report",
  report_unlocked: "Unlocked for revision",
  report_exported: "Exported report",
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function shortText(value: unknown) {
  if (value === undefined || value === null || value === "") return null
  return String(value)
}

function activityLabel(activity: Activity) {
  const base = ACTION_LABELS[activity.actionType] || humanize(activity.actionType)
  return activity.fieldName ? `${base} · ${humanize(activity.fieldName)}` : base
}

function activityDetails(activity: Activity) {
  const details: string[] = []
  const filename = shortText(activity.metadata?.filename)
  const stepId = shortText(activity.metadata?.stepId)
  const format = shortText(activity.metadata?.format)
  const permissionLevel = shortText(activity.metadata?.permissionLevel)
  const revision = shortText(activity.metadata?.revision)

  if (filename) details.push(`File: ${filename}`)
  if (stepId) details.push(`Step: ${stepId.toUpperCase()}`)
  if (format) details.push(`Format: ${format.toUpperCase()}`)
  if (permissionLevel) details.push(`Share: ${permissionLevel}`)
  if (revision) details.push(`Revision: ${revision}`)
  if (activity.entityType && activity.entityType !== "report") details.push(`Entity: ${humanize(activity.entityType)}`)

  return details
}

function hasActivityValueChange(activity: Activity) {
  return (
    activity.oldValuePreview !== undefined ||
    activity.newValuePreview !== undefined
  ) && (
    activity.oldValuePreview !== null ||
    activity.newValuePreview !== null
  )
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
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-indigo-100 bg-white p-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Completed and closed reports become reusable knowledge for future root-cause and corrective-action work.
            </span>
            <Link
              href="/knowledge"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <BookOpen className="size-3.5" />
              Knowledge Base
            </Link>
          </div>
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
            {activities.map((activity) => {
              const details = activityDetails(activity)
              const hasValueChange = hasActivityValueChange(activity)

              return (
                <div key={activity.id} className="space-y-2 p-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {activity.actorName || "Team member"} · {activityLabel(activity)}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {activity.entityId && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                        {activity.entityId.slice(0, 8)}
                      </span>
                    )}
                  </div>

                  {details.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {details.map((detail) => (
                        <span key={detail} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                          {detail}
                        </span>
                      ))}
                    </div>
                  )}

                  {hasValueChange && (
                    <div className="grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 font-medium text-slate-500">Before</div>
                        <div className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words text-slate-700">
                          {activity.oldValuePreview || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 font-medium text-slate-500">After</div>
                        <div className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words text-slate-700">
                          {activity.newValuePreview || "-"}
                        </div>
                      </div>
                    </div>
                  )}

                  {activity.reason && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
                      Reason: {activity.reason}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
