"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceRequestStatus } from "@/lib/service-requests";

interface UploadedFile {
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  storagePath?: string;
  status?: "uploaded" | "failed";
  failureReason?: string;
  uploadedAt?: string;
}

interface ServiceRequestRow {
  id: string;
  requestType?: string | null;
  companyName: string;
  contactEmail: string;
  templateUseCase: string;
  customerRequirements?: string | null;
  languageRequirement?: string | null;
  expectedExportFormat?: string | null;
  uploadedFiles?: UploadedFile[] | unknown;
  status: string;
  adminNotes?: string | null;
  quotedAmount?: string | null;
  createdAt: string | Date;
}

interface ServiceRequestsAdminProps {
  requests: ServiceRequestRow[];
  statuses: readonly ServiceRequestStatus[];
}

// Admin-only labels for the stored enum values. The stored value itself is never
// rewritten; only the displayed label is localized.
const TYPE_KEYS: Record<string, string> = {
  template_setup: "typeTemplateSetup",
  team_launch: "typeTeamLaunch",
  assisted_8d: "typeAssisted8d",
};

const STATUS_KEYS: Record<string, string> = {
  submitted: "statusSubmitted",
  under_review: "statusUnderReview",
  quote_sent: "statusQuoteSent",
  in_progress: "statusInProgress",
  ready_for_review: "statusReadyForReview",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

function uploadedFiles(value: ServiceRequestRow["uploadedFiles"]): UploadedFile[] {
  return Array.isArray(value) ? value.filter((item): item is UploadedFile => typeof item === "object" && item !== null) : [];
}

function formatFileSize(size?: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ServiceRequestsAdmin({ requests, statuses }: ServiceRequestsAdminProps) {
  const t = useTranslations("admin");
  const [rows, setRows] = useState(requests);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const typeLabel = (type?: string | null) => {
    const key = type ? TYPE_KEYS[type] : undefined;
    return key ? t(key) : t("typeTemplateSetup");
  };
  const statusLabel = (status?: string | null) => {
    const key = STATUS_KEYS[status || "submitted"] || "statusSubmitted";
    return t(key);
  };

  const visibleRows = useMemo(() => (
    filter === "all" ? rows : rows.filter((row) => row.status === filter)
  ), [filter, rows]);

  async function updateRequest(id: string, formData: FormData) {
    setSavingId(id);
    try {
      const quotedAmount = String(formData.get("quotedAmount") || "").trim();
      const res = await fetch("/api/custom-template-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: formData.get("status"),
          adminNotes: formData.get("adminNotes"),
          quotedAmount: quotedAmount || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t("updateFailed"));
      setRows((current) => current.map((row) => row.id === id ? data.request : row));
      toast.success(t("updateSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("updateFailed"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          {t("all")}
        </Button>
        {statuses.map((status) => (
          <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)}>
            {statusLabel(status)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {visibleRows.length === 0 && (
          <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
            {t("noMatch")}
          </div>
        )}

        {visibleRows.map((request) => {
          const files = uploadedFiles(request.uploadedFiles);
          const failedFiles = files.filter((file) => file.status === "failed").length;
          return (
            <article key={request.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {typeLabel(request.requestType)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {statusLabel(request.status)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{request.companyName}</h2>
                  <p className="text-sm text-slate-600">{request.contactEmail}</p>
                  <p className="mt-2 text-sm text-slate-700">{request.templateUseCase}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {t("created", { date: new Date(request.createdAt).toLocaleString() })}
                </div>
              </div>

              <div className="mt-4 grid gap-4 text-sm lg:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-950">{t("requirements")}</div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">{request.customerRequirements || "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-950">{t("languageExport")}</div>
                  <p className="mt-1 text-slate-600">{t("language", { value: request.languageRequirement || "-" })}</p>
                  <p className="text-slate-600">{t("exportFormat", { value: request.expectedExportFormat || "-" })}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border p-3">
                <div className="text-sm font-medium text-slate-950">{t("uploadedFiles")}</div>
                {failedFiles > 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    {t("uploadFailed", { count: failedFiles })}
                  </p>
                )}
                <ul className="mt-2 space-y-1 text-sm">
                  {files.length === 0 && <li className="text-slate-500">{t("noFiles")}</li>}
                  {files.map((file, index) => (
                    <li key={`${file.filename}-${index}`} className="flex flex-wrap gap-x-2 gap-y-1">
                      <span className="font-medium text-slate-700">{file.filename || t("fileNumber", { n: index + 1 })}</span>
                      <span className="text-xs text-slate-500">{file.mimeType || t("unknownType")}</span>
                      <span className="text-xs text-slate-500">{formatFileSize(file.fileSize)}</span>
                      <span className={file.status === "failed" ? "text-xs text-amber-700" : "text-xs text-emerald-700"}>
                        {file.status || t("uploaded")}
                      </span>
                      {file.failureReason && <span className="text-xs text-slate-500">{file.failureReason}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <form action={(formData) => updateRequest(request.id, formData)} className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_1fr_auto] lg:items-end">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">{t("status")}</span>
                  <select name="status" defaultValue={request.status} className="h-10 rounded-md border bg-white px-3 text-sm">
                    {statuses.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">{t("quote")}</span>
                  <Input
                    name="quotedAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={request.quotedAmount || ""}
                    placeholder="999.00"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">{t("adminNotes")}</span>
                  <Textarea name="adminNotes" defaultValue={request.adminNotes || ""} rows={2} placeholder={t("adminNotesPlaceholder")} />
                </label>
                <Button type="submit" disabled={savingId === request.id}>
                  {savingId === request.id ? t("saving") : t("save")}
                </Button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
