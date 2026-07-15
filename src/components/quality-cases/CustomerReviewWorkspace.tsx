"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReviewSection = {
  fieldPath: string;
  group: string;
  label: string;
  text: string;
};

type ReviewEvidence = {
  id: string;
  filename: string;
  mimeType: string | null;
  fileSize: number | null;
};

type CustomerTask = {
  taskType: "customer_review";
  expiresAt: string;
  participantName: string;
  status: string;
  projection: {
    case_summary?: {
      title?: string;
      complaintSummary?: string;
    };
    customer_response?: {
      response?: string;
      sections?: ReviewSection[];
      reviewVersion?: number;
      product?: string;
      supplier?: { name?: string; organization?: string | null } | null;
      submissionDate?: string | null;
      authorizedAt?: string | null;
    };
    customer_evidence?: ReviewEvidence[];
  };
};

const GROUP_HEADINGS: Record<string, string> = {
  problem_summary: "Problem Summary",
  containment: "Containment",
  root_cause_investigation: "Root Cause Investigation",
  corrective_action: "Corrective Action",
  verification: "Verification",
  prevention: "Prevention",
};

const GROUP_ORDER = [
  "problem_summary",
  "containment",
  "root_cause_investigation",
  "corrective_action",
  "verification",
  "prevention",
];

function readableDate(value: string | null | undefined, withTime = false) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(parsed);
}

function readableFileSize(value: number | null) {
  if (!value) return "File";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function CustomerReviewWorkspace({ token }: { token: string }) {
  const [task, setTask] = useState<CustomerTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<"accept" | "changes" | "">("");
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [completedAction, setCompletedAction] = useState<
    "accepted" | "changes_requested" | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.taskType !== "customer_review")
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "This review link is unavailable.",
        );
      setTask(payload as CustomerTask);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "This review link is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const sections = useMemo(
    () => task?.projection.customer_response?.sections || [],
    [task],
  );
  const groups = useMemo(
    () =>
      GROUP_ORDER.flatMap((group) => {
        const groupedSections = sections.filter(
          (section) => section.group === group,
        );
        return groupedSections.length
          ? [{ group, sections: groupedSections }]
          : [];
      }),
    [sections],
  );
  const fieldComments = sections.flatMap((section) => {
    const comment = comments[section.fieldPath]?.trim();
    return comment ? [{ fieldPath: section.fieldPath, comment }] : [];
  });

  async function submit(action: "customer_accept" | "request_customer_changes") {
    setBusyAction(action === "customer_accept" ? "accept" : "changes");
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          fieldComments:
            action === "request_customer_changes" ? fieldComments : [],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Your decision could not be saved.",
        );
      const accepted = action === "customer_accept";
      setCompletedAction(accepted ? "accepted" : "changes_requested");
      setConfirmAccept(false);
      toast.success(accepted ? "Response accepted" : "Change request sent");
    } catch (submitError) {
      toast.error("Unable to save your decision", {
        description:
          submitError instanceof Error ? submitError.message : undefined,
      });
    } finally {
      setBusyAction("");
    }
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-sm text-slate-500">
        <LoaderCircle className="size-4 animate-spin" />
        Loading the authorized response…
      </div>
    );

  if (error || !task)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <AlertTriangle className="size-6 text-amber-700" />
            <h1 className="mt-3 text-lg font-semibold text-amber-950">
              This review link is unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              The link may have expired, been revoked, or already been used.
              Please contact the coordinator for a new review link.
            </p>
          </CardContent>
        </Card>
      </div>
    );

  const response = task.projection.customer_response || {};
  const evidence = task.projection.customer_evidence || [];
  const supplier = response.supplier;
  const supplierDisplay =
    supplier?.organization || supplier?.name || "Not provided";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              QC
            </span>
            <span>Quality Case</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <Globe2 className="size-3.5" /> English
            </span>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              <LockKeyhole className="size-3" /> Secure review
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 px-5 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-200">
                  Customer Review
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Supplier Corrective Action Response
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  Review the authorized English response and supporting evidence.
                  Internal analysis and unconfirmed content are not included.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <FileCheck2 className="size-4 text-emerald-300" />
                Review version {response.reviewVersion || 1}
              </div>
            </div>
          </div>

          <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {[
              ["Product", response.product || "Not provided"],
              ["Issue Summary", response.sections?.find((section) => section.fieldPath === "complaint_summary")?.text || task.projection.case_summary?.complaintSummary || "Not provided"],
              ["Supplier", supplierDisplay],
              ["Submission Date", readableDate(response.submissionDate)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {completedAction ? (
          <Card className="mt-6 border-emerald-200 bg-emerald-50">
            <CardContent className="p-6">
              <CheckCircle2 className="size-7 text-emerald-600" />
              <h2 className="mt-3 text-xl font-semibold text-emerald-950">
                {completedAction === "accepted"
                  ? "Your acceptance has been recorded"
                  : "Your change request has been sent"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-900">
                {completedAction === "accepted"
                  ? "Acceptance does not close this Quality Case. The internal team will complete effectiveness verification separately."
                  : "The coordinator will review your field-level comments and decide whether the supplier needs to provide additional information."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="space-y-5">
              {groups.map(({ group, sections: groupedSections }, groupIndex) => (
                <Card key={group}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                      <span className="grid size-7 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {groupIndex + 1}
                      </span>
                      <h2 className="text-lg font-semibold text-slate-950">
                        {GROUP_HEADINGS[group] || group}
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupedSections.map((section) => {
                        const isOpen = openComments.includes(section.fieldPath);
                        return (
                          <div key={section.fieldPath} className="px-5 py-5 sm:px-6">
                            {groupedSections.length > 1 ? (
                              <p className="text-sm font-medium text-slate-700">
                                {section.label}
                              </p>
                            ) : null}
                            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                              {section.text}
                            </p>
                            <div className="mt-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="px-0 text-indigo-700 hover:bg-transparent hover:text-indigo-900"
                                onClick={() => {
                                  setOpenComments((current) =>
                                    isOpen
                                      ? current.filter(
                                          (value) => value !== section.fieldPath,
                                        )
                                      : [...current, section.fieldPath],
                                  );
                                  if (isOpen)
                                    setComments((current) => {
                                      const next = { ...current };
                                      delete next[section.fieldPath];
                                      return next;
                                    });
                                }}
                              >
                                <MessageSquareText className="size-4" />
                                {isOpen
                                  ? "Remove change comment"
                                  : "Request a change to this section"}
                              </Button>
                            </div>
                            {isOpen ? (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <Label htmlFor={`comment-${section.fieldPath}`}>
                                  Comment for {section.label}
                                </Label>
                                <Textarea
                                  id={`comment-${section.fieldPath}`}
                                  className="mt-2 bg-white"
                                  rows={3}
                                  value={comments[section.fieldPath] || ""}
                                  onChange={(event) =>
                                    setComments((current) => ({
                                      ...current,
                                      [section.fieldPath]: event.target.value,
                                    }))
                                  }
                                  placeholder="Explain what is unclear or what evidence is needed."
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-slate-950">
                      Verification Evidence
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Only evidence explicitly authorized by the coordinator is
                    available here.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {evidence.length ? (
                      evidence.map((file) => (
                        <a
                          key={file.id}
                          href={`/api/quality-case-tasks/${token}/evidence/${file.id}`}
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          <span className="min-w-0 truncate">{file.filename}</span>
                          <span className="ml-3 flex shrink-0 items-center gap-1 text-xs text-slate-500">
                            {readableFileSize(file.fileSize)}
                            <Download className="size-3.5" />
                          </span>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No evidence files were authorized for this review.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <Card className="border-indigo-200 shadow-sm">
                <CardContent className="p-5">
                  <h2 className="font-semibold text-slate-950">
                    Your review decision
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Accept this authorized version, or add comments to specific
                    sections and request changes.
                  </p>
                  {fieldComments.length ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {fieldComments.length} section
                      {fieldComments.length === 1 ? "" : "s"} marked for change.
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                      disabled={Boolean(busyAction)}
                      onClick={() => setConfirmAccept(true)}
                    >
                      <CheckCircle2 className="size-4" /> Accept Response
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={Boolean(busyAction) || !fieldComments.length}
                      onClick={() => void submit("request_customer_changes")}
                    >
                      {busyAction === "changes" ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Undo2 className="size-4" />
                      )}
                      Request Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {confirmAccept ? (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-emerald-950">
                      Confirm acceptance
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                      You are accepting review version {response.reviewVersion || 1}.
                      This will not close the Quality Case.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAccept(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-700 text-white hover:bg-emerald-800"
                        disabled={busyAction === "accept"}
                        onClick={() => void submit("customer_accept")}
                      >
                        {busyAction === "accept" ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Confirm acceptance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <h2 className="font-semibold text-slate-950">
                      Review scope
                    </h2>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Reviewer</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {task.participantName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Link expires</dt>
                      <dd className="mt-1 flex items-center gap-1.5 font-medium text-slate-900">
                        <Clock3 className="size-3.5 text-slate-400" />
                        {readableDate(task.expiresAt, true)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                    This link is restricted to this Case and version. It does not
                    provide access to internal notes, supplier working answers,
                    or AI analysis.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
