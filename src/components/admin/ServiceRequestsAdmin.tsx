"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { serviceRequestStatusLabel, serviceRequestTypeLabel, type ServiceRequestStatus } from "@/lib/service-requests";

interface UploadedFile {
  filename?: string;
  url?: string;
  fileSize?: number;
  mimeType?: string;
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

function uploadedFiles(value: ServiceRequestRow["uploadedFiles"]): UploadedFile[] {
  return Array.isArray(value) ? value.filter((item): item is UploadedFile => typeof item === "object" && item !== null) : [];
}

export function ServiceRequestsAdmin({ requests, statuses }: ServiceRequestsAdminProps) {
  const [rows, setRows] = useState(requests);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

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
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setRows((current) => current.map((row) => row.id === id ? data.request : row));
      toast.success("Service request updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All
        </Button>
        {statuses.map((status) => (
          <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)}>
            {serviceRequestStatusLabel(status)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {visibleRows.length === 0 && (
          <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
            No service requests match this filter.
          </div>
        )}

        {visibleRows.map((request) => {
          const files = uploadedFiles(request.uploadedFiles);
          return (
            <article key={request.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {serviceRequestTypeLabel(request.requestType)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {serviceRequestStatusLabel(request.status)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{request.companyName}</h2>
                  <p className="text-sm text-slate-600">{request.contactEmail}</p>
                  <p className="mt-2 text-sm text-slate-700">{request.templateUseCase}</p>
                </div>
                <div className="text-xs text-slate-500">
                  Created {new Date(request.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="mt-4 grid gap-4 text-sm lg:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-950">Requirements</div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">{request.customerRequirements || "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-950">Language / export</div>
                  <p className="mt-1 text-slate-600">Language: {request.languageRequirement || "-"}</p>
                  <p className="text-slate-600">Export: {request.expectedExportFormat || "-"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border p-3">
                <div className="text-sm font-medium text-slate-950">Uploaded files</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {files.length === 0 && <li className="text-slate-500">No files recorded.</li>}
                  {files.map((file, index) => (
                    <li key={`${file.filename}-${index}`}>
                      {file.url ? (
                        <a className="text-indigo-600 underline underline-offset-4" href={file.url} target="_blank" rel="noreferrer">
                          {file.filename || `File ${index + 1}`}
                        </a>
                      ) : (
                        <span>{file.filename || `File ${index + 1}`}</span>
                      )}
                      <span className="ml-2 text-xs text-slate-500">{file.mimeType || ""}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <form action={(formData) => updateRequest(request.id, formData)} className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_1fr_auto] lg:items-end">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">Status</span>
                  <select name="status" defaultValue={request.status} className="h-10 rounded-md border bg-white px-3 text-sm">
                    {statuses.map((status) => (
                      <option key={status} value={status}>{serviceRequestStatusLabel(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">Quote</span>
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
                  <span className="font-medium text-slate-700">Admin notes</span>
                  <Textarea name="adminNotes" defaultValue={request.adminNotes || ""} rows={2} placeholder="Scope, next step, delivery notes..." />
                </label>
                <Button type="submit" disabled={savingId === request.id}>
                  {savingId === request.id ? "Saving..." : "Save"}
                </Button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
