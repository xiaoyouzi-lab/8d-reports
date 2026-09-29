"use client"

import { useRef, useState } from "react"
import { ImageUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { ReportData } from "@/lib/report-steps"

type SignatureRole = "prepared" | "reviewed" | "approved"

interface SignatureConfig {
  role: SignatureRole
  titleKey: string
  nameField: keyof ReportData
  dateField: keyof ReportData
  idField: keyof ReportData
  urlField: keyof ReportData
}

const SIGNATURES: SignatureConfig[] = [
  {
    role: "prepared",
    titleKey: "preparedSignature",
    nameField: "preparedBy",
    dateField: "preparedDate",
    idField: "preparedSignatureId",
    urlField: "preparedSignatureUrl",
  },
  {
    role: "reviewed",
    titleKey: "reviewedSignature",
    nameField: "reviewedBy",
    dateField: "reviewedDate",
    idField: "reviewedSignatureId",
    urlField: "reviewedSignatureUrl",
  },
  {
    role: "approved",
    titleKey: "approvedSignature",
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
  canEdit?: boolean
}

function SignatureCard({
  config,
  reportId,
  data,
  onChange,
  canEdit,
}: {
  config: SignatureConfig
  reportId: string
  data: ReportData
  onChange: (name: string, value: string) => void
  canEdit: boolean
}) {
  const t = useTranslations("editor")
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const signatureUrl = String(data[config.urlField] || "")
  const title = t(config.titleKey)

  const upload = async (file: File) => {
    if (!canEdit) {
      toast.error(t("noPermReplaceSignature"))
      return
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error(t("signatureTypeError"))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("signatureSizeError"))
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("role", config.role)
      const res = await fetch(`/api/reports/${reportId}/signatures`, { method: "POST", body: form })
      const result = await res.json().catch(() => null)
      if (!res.ok) throw new Error(result?.error || t("signatureUploadFailed"))
      onChange(String(config.idField), result.attachmentId || "")
      onChange(String(config.urlField), result.url || "")
      toast.success(t("signatureUploaded"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("signatureUploadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!canEdit) {
      toast.error(t("noPermDeleteSignature"))
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/signatures/${config.role}`, { method: "DELETE" })
      const result = await res.json().catch(() => null)
      if (!res.ok) throw new Error(result?.error || t("signatureRemovalFailed"))
      onChange(String(config.idField), "")
      onChange(String(config.urlField), "")
      toast.success(t("signatureRemoved"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("signatureRemovalFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">
            {String(data[config.nameField] || t("nameNotFilled"))} · {String(data[config.dateField] || t("dateNotFilled"))}
          </div>
        </div>
      </div>
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed bg-muted/30">
        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signatureUrl} alt={title} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">{t("noSignatureUploaded")}</span>
        )}
      </div>
      {canEdit ? (
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
            {t("upload")}
          </Button>
          {signatureUrl && (
            <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={remove}>
              <Trash2 className="size-3.5" />
              {t("remove")}
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("signatureRoleUnavailable")}
        </p>
      )}
    </div>
  )
}

export function SignatureApprovalArea({ reportId, data, onChange, canEdit = true }: SignatureApprovalAreaProps) {
  const t = useTranslations("editor")
  return (
    <div className="space-y-3 border-t pt-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("approvalSignatures")}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("approvalSignaturesDesc")}
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
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  )
}
