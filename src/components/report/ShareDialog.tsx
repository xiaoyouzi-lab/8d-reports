"use client"

import { useState, useEffect } from "react"
import { Share2, Copy, Check, Link, ExternalLink } from "lucide-react"
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

interface ShareInfo {
  token: string
  createdAt: string
  views: number
}

function getShareKey(reportId: string): string {
  return `share-${reportId}`
}

function loadShareInfo(reportId: string): ShareInfo | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(getShareKey(reportId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveShareInfo(reportId: string, info: ShareInfo) {
  localStorage.setItem(getShareKey(reportId), JSON.stringify(info))
}

function removeShareInfo(reportId: string) {
  localStorage.removeItem(getShareKey(reportId))
}

interface ShareDialogProps {
  reportId: string
  reportTitle: string
}

export function ShareDialog({ reportId, reportTitle }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setShareInfo(loadShareInfo(reportId))
  }, [reportId])

  useEffect(() => {
    if (!open) {
      setShareInfo(loadShareInfo(reportId))
    }
  }, [open, reportId])

  const shareUrl = shareInfo
    ? `https://8dreports.com/share/${shareInfo.token}`
    : ""

  const handleCreateLink = () => {
    const token = crypto.randomUUID()
    const info: ShareInfo = {
      token,
      createdAt: new Date().toISOString(),
      views: 0,
    }
    saveShareInfo(reportId, info)
    setShareInfo(info)
    toast.success("Share link created!")
  }

  const handleDeleteLink = () => {
    removeShareInfo(reportId)
    setShareInfo(null)
    toast.success("Share link removed")
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
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Share2 className="size-3.5" />
            Share
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
          {!mounted ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : shareInfo ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <Link className="size-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Shared — {shareInfo.views} views
                </span>
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
                {mounted
                  ? new Date(shareInfo.createdAt).toLocaleDateString()
                  : ""}
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
                Create a share link to allow anyone to view this report
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {mounted && shareInfo ? (
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
              disabled={!mounted}
            >
              <Link className="size-4" />
              Create Share Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
