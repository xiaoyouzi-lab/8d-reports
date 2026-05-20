"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Image, FileUp, X, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface Attachment {
  id: string
  reportId: string
  stepId: string | null
  storagePath: string
  url: string
  filename: string
  fileType: string
  mimeType: string | null
  fileSize: number | null
}

interface AttachmentAreaProps {
  reportId: string
  stepId: string
}

const ALLOWED_IMAGE = "image/jpeg,image/png,image/webp,image/heic,image/heif"
const ALLOWED_FILE = ".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt,.zip"
const MAX_SIZE = 5 * 1024 * 1024

export function AttachmentArea({ reportId, stepId }: AttachmentAreaProps) {
  const t = useTranslations("editor")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/attachments`)
      if (res.ok) {
        const data = await res.json()
        setAttachments((data as Attachment[]).filter((a) => a.stepId === stepId))
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAttachments() }, [reportId, stepId])

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast.error(t("fileTooBig"))
      return
    }

    const key = file.name + file.size
    setUploadingFiles((prev) => new Set(prev).add(key))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("reportId", reportId)
      formData.append("stepId", stepId)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        toast.error(err.error || t("fileTooBig"))
        return
      }
      const { storagePath, publicUrl, fileType, mimeType, fileSize } = await uploadRes.json()

      const saveRes = await fetch(`/api/reports/${reportId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath, url: publicUrl, filename: file.name,
          fileType, mimeType, fileSize, stepId,
        }),
      })
      if (saveRes.ok) {
        const newAtt = await saveRes.json()
        setAttachments((prev) => [...prev, newAtt])
      }
    } catch {
      toast.error(t("createFailed"))
    } finally {
      setUploadingFiles((prev) => { const n = new Set(prev); n.delete(key); return n })
    }
  }

  const handleDelete = async (att: Attachment) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/attachments?attachmentId=${att.id}`, { method: "DELETE" })
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== att.id))
      }
    } catch { /* ignore */ }
  }

  const isImage = (att: Attachment) => att.fileType === "photo" || att.mimeType?.startsWith("image/")

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("attachments")}
        </span>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          className="h-8 text-xs"
        >
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 text-xs"
        >
          <Image className="size-3.5 mr-1.5" />
          {t("photoLibrary")}
        </Button>

        <input
          ref={docInputRef}
          type="file"
          accept={ALLOWED_FILE}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => docInputRef.current?.click()}
          className="h-8 text-xs"
        >
          <FileUp className="size-3.5 mr-1.5" />
          {t("uploadFile")}
        </Button>
      </div>

      {loading && (
        <div className="text-xs text-muted-foreground py-2">Loading...</div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex flex-col items-center rounded-lg border border-border p-2 bg-white"
            >
              <button
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(att)}
              >
                <X className="size-3" />
              </button>
              {isImage(att) ? (
                <img
                  src={att.url}
                  alt={att.filename}
                  className="h-20 w-full object-cover rounded"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-20 w-full items-center justify-center rounded bg-muted">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
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
    </div>
  )
}
