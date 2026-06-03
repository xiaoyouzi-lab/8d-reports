"use client"

import { useRef, useState } from "react"
import { ImageUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { ReportData } from "@/lib/report-steps"

type SignatureRole = "prepared" | "reviewed" | "approved"

interface SignatureConfig {
  role: SignatureRole
  title: string
  nameField: keyof ReportData
  dateField: keyof ReportData
  idField: keyof ReportData
  urlField: keyof ReportData
}

const SIGNATURES: SignatureConfig[] = [
  {
    role: "prepared",
    title: "Prepared signature",
    nameField: "preparedBy",
    dateField: "preparedDate",
    idField: "preparedSignatureId",
    urlField: "preparedSignatureUrl",
  },
  {
    role: "reviewed",
    title: "Reviewed signature",
    nameField: "reviewedBy",
    dateField: "reviewedDate",
    idField: "reviewedSignatureId",
    urlField: "reviewedSignatureUrl",
  },
  {
    role: "approved",
    title: "Approved signature",
    nameField: "approverName",
    dateField: "approverDate",
    idField: "approvedSignatureId",
    urlField: "approvedSignatureUrl",
  },
]

interface SignatureApprovalAreaProps {
  reportId: string
  data: ReportData
  onChange: (name: string, value: string) => void
}

function SignatureCard({
  config,
  reportId,
  data,
  onChange,
}: {
  config: SignatureConfig
  reportId: string
  data: ReportData
  onChange: (name: string, value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const signatureUrl = String(data[config.urlField] || "")

  const upload = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Signature must be PNG, JPG, or WebP")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Signature image must be 2MB or less")
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("role", config.role)
      const res = await fetch(`/api/reports/${reportId}/signatures`, { method: "POST", body: form })
      const result = await res.json().catch(() => null)
      if (!res.ok) throw new Error(result?.error || "Signature upload failed")
      onChange(String(config.idField), result.attachmentId || "")
      onChange(String(config.urlField), result.url || "")
      toast.success("Signature uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signature upload failed")
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/signatures/${config.role}`, { method: "DELETE" })
      const result = await res.json().catch(() => null)
      if (!res.ok) throw new Error(result?.error || "Signature removal failed")
      onChange(String(config.idField), "")
      onChange(String(config.urlField), "")
      toast.success("Signature removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signature removal failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-foreground">{config.title}</div>
          <div className="text-xs text-muted-foreground">
            {String(data[config.nameField] || "Name not filled")} · {String(data[config.dateField] || "Date not filled")}
          </div>
        </div>
      </div>
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed bg-muted/30">
        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signatureUrl} alt={config.title} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">No signature uploaded</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ""
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => inputRef.current?.click()}>
          <ImageUp className="size-3.5" />
          Upload
        </Button>
        {signatureUrl && (
          <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={remove}>
            <Trash2 className="size-3.5" />
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

export function SignatureApprovalArea({ reportId, data, onChange }: SignatureApprovalAreaProps) {
  return (
    <div className="space-y-3 border-t pt-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Approval signatures</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Upload PNG, JPG, or WebP signature images for the customer-facing PDF and Word exports.
          These images are for report presentation and are not a legal electronic signature.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SIGNATURES.map((config) => (
          <SignatureCard
            key={config.role}
            config={config}
            reportId={reportId}
            data={data}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}
