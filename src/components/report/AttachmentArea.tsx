"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { X, Camera, Image as ImageIcon, FileUp, FileText, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { trackEvent } from "@/lib/analytics"

const ALLOWED_IMAGE = "image/jpeg,image/png,image/webp,image/heic,image/heif"
const ALLOWED_FILE = ".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt,.zip"

interface Attachment {
  id: string
  filename: string
  url: string
  fileType: string
  mimeType?: string
  fileSize?: number
  stepId?: string
}

function getAttachmentFileUrl(att: Attachment): string {
  return `/api/attachments/${att.id}/file`
}

function isImage(att: Attachment): boolean {
  if (att.fileType === "photo") return true
  return att.mimeType?.startsWith("image/") ?? false
}

function AttachmentImage({
  attachment,
  onPreview,
}: {
  attachment: Attachment
  onPreview: (url: string) => void
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let nextUrl: string | null = null

    async function loadImage() {
      setFailed(false)
      try {
        const res = await fetch(getAttachmentFileUrl(attachment), {
          credentials: "same-origin",
        })
        if (!res.ok) throw new Error("Image preview failed")
        const blob = await res.blob()
        nextUrl = URL.createObjectURL(blob)
        if (!cancelled) setObjectUrl(nextUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void loadImage()

    return () => {
      cancelled = true
      if (nextUrl) URL.revokeObjectURL(nextUrl)
    }
  }, [attachment])

  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded bg-muted px-2 text-center text-[11px] text-muted-foreground">
        <FileText className="size-7" />
        <span>Preview unavailable</span>
      </div>
    )
  }

  if (!objectUrl) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded bg-muted text-[11px] text-muted-foreground">
        Loading preview...
      </div>
    )
  }

  return (
    <button
      type="button"
      className="relative block w-full overflow-hidden rounded bg-muted"
      onClick={() => onPreview(objectUrl)}
    >
      <img
        src={objectUrl}
        alt={attachment.filename}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center rounded bg-black/0 transition-colors group-hover:bg-black/10">
        <Maximize2 className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  )
}

interface AttachmentAreaProps {
  reportId: string
  stepId: string
  isPro?: boolean
}

export function AttachmentArea({ reportId, stepId, isPro = false }: AttachmentAreaProps) {
  const t = useTranslations("editor")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/attachments`)
      if (res.ok) {
        const all = await res.json()
        setAttachments(all.filter((a: Attachment) => a.stepId === stepId))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [reportId, stepId])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAttachments()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchAttachments])

  const handleFileSelect = async (file: File) => {
    const maxFileSize = isPro ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxFileSize) {
      toast.error(`File too large (max ${isPro ? "10MB" : "5MB"})`)
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("reportId", reportId)
      form.append("stepId", stepId)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => null)
        throw new Error(err?.error || "Upload failed")
      }
      const uploaded = await uploadRes.json()

      const attachRes = await fetch(`/api/reports/${reportId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath: uploaded.storagePath,
          url: uploaded.url,
          filename: file.name,
          fileType: file.type.startsWith("image/") ? "photo" : "file",
          mimeType: file.type,
          fileSize: file.size,
          stepId,
        }),
      })
      if (!attachRes.ok) {
        const err = await attachRes.json().catch(() => null)
        throw new Error(err?.error || "Attachment save failed")
      }
      trackEvent("attachment_uploaded", { stepId, fileType: file.type, fileSize: file.size }, reportId)
      toast.success("File attached")
      await fetchAttachments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (att: Attachment) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/attachments?attachmentId=${att.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setAttachments((prev) => prev.filter((a) => a.id !== att.id))
      toast.success("Attachment removed")
    } catch {
      toast.error("Failed to remove attachment")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{t("attachments")}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          capture="environment"
          accept={ALLOWED_IMAGE}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }}
        />
        <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} className="h-8 text-xs" disabled={uploading}>
          <Camera className="size-3.5 mr-1.5" />
          {t("takePhoto")}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }}
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-xs" disabled={uploading}>
          <ImageIcon className="size-3.5 mr-1.5" />
          {t("photoLibrary")}
        </Button>

        <input
          ref={docInputRef}
          type="file"
          accept={ALLOWED_FILE}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }}
        />
        <Button variant="outline" size="sm" onClick={() => docInputRef.current?.click()} className="h-8 text-xs" disabled={uploading}>
          <FileUp className="size-3.5 mr-1.5" />
          {t("uploadFile")}
        </Button>
      </div>

      {uploading && (
        <div className="text-xs text-muted-foreground py-2">Uploading...</div>
      )}

      {loading && attachments.length === 0 && (
        <div className="text-xs text-muted-foreground py-2">Loading...</div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex min-w-0 flex-col items-center overflow-hidden rounded-lg border border-border bg-white p-2"
            >
              <button
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(att)}
              >
                <X className="size-3" />
              </button>
              {isImage(att) ? (
                <AttachmentImage attachment={att} onPreview={setPreviewUrl} />
              ) : (
                <a href={getAttachmentFileUrl(att)} target="_blank" rel="noopener noreferrer" className="flex aspect-[4/3] w-full items-center justify-center rounded bg-muted hover:bg-muted/80">
                  <FileText className="size-8 text-muted-foreground" />
                </a>
              )}
              <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">
                {att.filename}
              </span>
              {att.fileSize && (
                <span className="text-[9px] text-muted-foreground/70">
                  {(att.fileSize / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="size-6" />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
