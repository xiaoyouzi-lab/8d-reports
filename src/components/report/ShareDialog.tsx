"use client"

import { useState, useEffect, useCallback } from "react"
import { Share2, Copy, Check, Link, ExternalLink, Eye, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { trackEvent } from "@/lib/analytics"

interface ShareInfo {
  accessToken: string
  views: number
  permissionLevel: string
  createdAt: string
}

interface ShareDialogProps {
  reportId: string
  reportTitle: string
  isPro?: boolean
}

export function ShareDialog({ reportId, reportTitle, isPro = false }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const fetchShare = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/share`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.accessToken) {
          setShareInfo(data)
          setEditMode(data.permissionLevel === "edit")
        }
      }
    } catch {
      // ignore
    }
  }, [reportId])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      void fetchShare()
    }, 0)
    return () => clearTimeout(timer)
  }, [open, fetchShare])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = shareInfo?.accessToken ? `${baseUrl}/share/${shareInfo.accessToken}` : ""

  const handleCreateLink = async () => {
    setLoading(true)
    try {
      const permissionLevel = isPro && editMode ? "edit" : "view"
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionLevel }),
      })
      if (res.ok) {
        const data = await res.json()
        setShareInfo(data)
        trackEvent("share_link_created", { permissionLevel }, reportId)
        toast.success("Share link created!")
      } else {
        toast.error("Failed to create share link")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePermission = async (newLevel: string) => {
    if (newLevel === "edit" && !isPro) {
      trackEvent("upgrade_clicked", { source: "share_edit_gate", plan: "free" }, reportId)
      toast("Editable share links are a Pro feature", {
        description: "Upgrade to let recipients edit shared reports.",
      })
      return
    }
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionLevel: newLevel }),
      })
      if (res.ok) {
        const data = await res.json()
        setShareInfo(data)
        setEditMode(newLevel === "edit")
        toast.success(newLevel === "edit" ? "Edit access enabled" : "View-only mode set")
      }
    } catch {
      toast.error("Failed to update permissions")
    }
  }

  const handleDeleteLink = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, { method: "DELETE" })
      if (res.ok) {
        setShareInfo(null)
        setEditMode(false)
        toast.success("Share link removed")
      } else {
        toast.error("Failed to remove share link")
      }
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="inline-flex">
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>
            {reportTitle || "Untitled Report"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {shareInfo ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <Link className="size-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Shared — {shareInfo.views ?? 0} views
                </span>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Permission
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdatePermission("view")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      shareInfo.permissionLevel !== "edit"
                        ? "bg-white text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="size-3.5" />
                    View only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePermission("edit")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      shareInfo.permissionLevel === "edit"
                        ? "bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-300"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Edit3 className="size-3.5" />
                    Can edit
                  </button>
                </div>
                {shareInfo.permissionLevel === "edit" && (
                  <p className="text-xs text-amber-600">
                    Recipients can edit and save — changes update the original report. No login required.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Share link
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created{" "}
                {new Date(shareInfo.createdAt).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
                <Share2 className="size-5 text-slate-400" />
              </div>
              <span className="text-sm text-muted-foreground">
                Not shared
              </span>
              <p className="text-center text-xs text-muted-foreground">
                Create a share link to allow anyone to view or edit this report
              </p>

              <div className="w-full space-y-2 rounded-lg border bg-muted/30 p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Choose permission level
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      !editMode
                        ? "bg-white text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="size-3.5" />
                    View only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPro) {
                        trackEvent("upgrade_clicked", { source: "share_edit_gate", plan: "free" }, reportId)
                        toast("Editable share links are a Pro feature")
                        return
                      }
                      setEditMode(true)
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      editMode
                        ? "bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-300"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Edit3 className="size-3.5" />
                    Can edit
                  </button>
                </div>
                {editMode && (
                  <p className="text-xs text-amber-600">
                    Recipients can edit and save without logging in.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {shareInfo ? (
            <>
              <Button
                variant="destructive"
                onClick={handleDeleteLink}
                size="sm"
              >
                Delete Link
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(shareUrl, "_blank")}
                size="sm"
              >
                <ExternalLink className="size-3.5" />
                Open
              </Button>
            </>
          ) : (
            <Button
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleCreateLink}
              disabled={loading}
            >
              <Link className="size-4" />
              {loading ? "Creating..." : "Create Share Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
