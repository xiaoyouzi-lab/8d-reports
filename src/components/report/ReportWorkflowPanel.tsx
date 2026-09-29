"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, History, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { trackEvent } from "@/lib/analytics"
import type { KnowledgeReadinessSummary } from "@/lib/report-steps"
import { KnowledgeReadinessPanel, knowledgeReadinessAnalytics } from "@/components/report/KnowledgeReadinessPanel"

const LOCKED_STATUSES = new Set(["approved", "submitted", "closed"])

const STATUS_KEYS = [
  ["draft", "statusDraft"],
  ["internal_review", "statusInternalReview"],
  ["approved", "statusApproved"],
  ["submitted", "statusSubmittedCustomer"],
  ["closed", "statusClosed"],
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

const ACTION_LABEL_KEYS: Record<string, string> = {
  report_field_updated: "actionReportFieldUpdated",
  report_updated: "actionReportUpdated",
  attachment_uploaded: "actionAttachmentUploaded",
  attachment_deleted: "actionAttachmentDeleted",
  share_link_created: "actionShareLinkCreated",
  share_link_updated: "actionShareLinkUpdated",
  share_link_revoked: "actionShareLinkRevoked",
  workflow_status_changed: "actionWorkflowStatusChanged",
  report_approved_or_locked: "actionReportApprovedOrLocked",
  report_unlocked: "actionReportUnlocked",
  report_exported: "actionReportExported",
}

// The activity feed mixes known action types with raw database values. Known
// actions come from the catalog; unknown action/field/entity names keep the
// humanized database value rather than inventing a translation.
function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function shortText(value: unknown) {
  if (value === undefined || value === null || value === "") return null
  return String(value)
}

type Translator = (key: string, values?: Record<string, string | number>) => string

function activityLabel(activity: Activity, t: Translator) {
  const key = ACTION_LABEL_KEYS[activity.actionType]
  const base = key ? t(key) : humanize(activity.actionType)
  return activity.fieldName ? `${base} · ${humanize(activity.fieldName)}` : base
}

function activityDetails(activity: Activity, t: Translator) {
  const details: string[] = []
  const filename = shortText(activity.metadata?.filename)
  const stepId = shortText(activity.metadata?.stepId)
  const format = shortText(activity.metadata?.format)
  const permissionLevel = shortText(activity.metadata?.permissionLevel)
  const revision = shortText(activity.metadata?.revision)

  if (filename) details.push(t("detailFile", { value: filename }))
  if (stepId) details.push(t("detailStep", { value: stepId.toUpperCase() }))
  if (format) details.push(t("detailFormat", { value: format.toUpperCase() }))
  if (permissionLevel) details.push(t("detailShare", { value: permissionLevel }))
  if (revision) details.push(t("detailRevision", { value: revision }))
  if (activity.entityType && activity.entityType !== "report") details.push(t("detailEntity", { value: humanize(activity.entityType) }))

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
  knowledgeReadiness,
  plan,
  onUpdated,
  onBeforeAction,
}: {
  reportId: string
  workflowStatus: string
  revision: number
  locked: boolean
  canManageWorkflow: boolean
  knowledgeReadiness: KnowledgeReadinessSummary
  plan: "free" | "pro" | "team"
  onUpdated: (report: { workflowStatus: string; revision: number; lockedAt?: string | null }) => void
  /**
   * Persists pending edits before a workflow transition so approval/locking
   * never runs against an older saved version. Returns null when saving failed.
   */
  onBeforeAction?: () => Promise<unknown>
}) {
  const t = useTranslations("editor")
  const tn = useTranslations("nav")
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
      if (onBeforeAction) {
        const saved = await onBeforeAction()
        if (!saved) return
      }
      const res = await fetch(`/api/reports/${reportId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || t("workflowUpdateFailed"))
      onUpdated(data)
      setReason("")
      const activityRes = await fetch(`/api/reports/${reportId}/activity`)
      if (activityRes.ok) setActivities(await activityRes.json())
      toast.success(body.action === "unlock" ? t("reportUnlocked") : t("workflowUpdated"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("workflowUpdateFailed"))
    } finally {
      setSaving(false)
    }
  }

  function handleWorkflowStatusChange(nextStatus: string) {
    if (LOCKED_STATUSES.has(nextStatus) && knowledgeReadiness.missingCount > 0) {
      trackEvent(
        "knowledge_readiness_warning_shown",
        knowledgeReadinessAnalytics(knowledgeReadiness, plan),
        reportId,
      )
      toast.warning(t("knowledgeWarning"))
    }
    void updateWorkflow({ workflowStatus: nextStatus })
  }

  const currentStatusKey = STATUS_KEYS.find(([value]) => value === workflowStatus)?.[1]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {locked ? <Lock className="size-3.5" /> : <History className="size-3.5" />}
        <span className="hidden md:inline">{t("workflow")}</span>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("workflowActivity")}</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border bg-slate-50 p-3 text-sm">
          <div className="font-medium">{t("revisionStatus", { revision, status: currentStatusKey ? t(currentStatusKey) : workflowStatus })}</div>
          <div className="mt-1 text-xs text-muted-foreground">{locked ? t("lockedAgainstEdits") : t("openForEditing")}</div>
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-indigo-100 bg-white p-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {t("reuseKnowledgeDesc")}
            </span>
            <Link
              href="/knowledge"
              onClick={() => trackEvent("app_navigation_clicked", {
                navItem: "knowledge_base",
                destination: "/knowledge",
                location: "workflow_panel",
              })}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <BookOpen className="size-3.5" />
              {tn("knowledgeBase")}
            </Link>
          </div>
          {canManageWorkflow && !locked && (
            <select
              className="mt-3 h-9 w-full rounded-md border bg-white px-2 text-sm"
              value={workflowStatus}
              disabled={saving}
              onChange={(event) => handleWorkflowStatusChange(event.target.value)}
            >
              {STATUS_KEYS.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
            </select>
          )}
          {canManageWorkflow && locked && (
            <div className="mt-3 grid gap-2">
              {workflowStatus === "approved" && (
                <Button disabled={saving} onClick={() => void updateWorkflow({ workflowStatus: "submitted" })}>
                  {t("submitToCustomer")}
                </Button>
              )}
              {workflowStatus === "submitted" && (
                <Button disabled={saving} onClick={() => void updateWorkflow({ workflowStatus: "closed" })}>
                  {t("closeReport")}
                </Button>
              )}
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("unlockReasonPlaceholder")} rows={3} />
              <Button variant="outline" disabled={saving || !reason.trim()} onClick={() => void updateWorkflow({ action: "unlock", reason })}>
                <Unlock className="size-3.5" /> {t("unlockForRevision")}
              </Button>
            </div>
          )}
        </div>
        <KnowledgeReadinessPanel
          summary={knowledgeReadiness}
          reportId={reportId}
          plan={plan}
          location="workflow_panel"
          trackViewed={false}
        />
        <div>
          <h3 className="text-sm font-semibold">{t("activityLog")}</h3>
          <div className="mt-2 divide-y rounded-lg border">
            {activities.length === 0 && <div className="p-3 text-xs text-muted-foreground">{t("noActivity")}</div>}
            {activities.map((activity) => {
              const details = activityDetails(activity, t)
              const hasValueChange = hasActivityValueChange(activity)

              return (
                <div key={activity.id} className="space-y-2 p-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {activity.actorName || t("teamMember")} · {activityLabel(activity, t)}
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
                        <div className="mb-1 font-medium text-slate-500">{t("before")}</div>
                        <div className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words text-slate-700">
                          {activity.oldValuePreview || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 font-medium text-slate-500">{t("after")}</div>
                        <div className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words text-slate-700">
                          {activity.newValuePreview || "-"}
                        </div>
                      </div>
                    </div>
                  )}

                  {activity.reason && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
                      {t("reasonPrefix", { reason: activity.reason })}
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
