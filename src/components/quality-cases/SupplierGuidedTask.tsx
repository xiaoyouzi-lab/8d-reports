"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type EvidenceRequirement = {
  id: string;
  requirement: string;
  reason: string;
  status: string;
  stage: string | null;
  relatedAnswerId: string | null;
  evidenceIds: string[];
};

type EvidenceFile = {
  id: string;
  requirementIds: string[];
  stage: string | null;
  filename: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
};

type Submission = {
  canSubmit: boolean;
  answeredQuestions: number;
  totalQuestions: number;
  currentAnswers: Array<{ id: string; stage: string; text: string }>;
  evidence: {
    requirements: EvidenceRequirement[];
    files: EvidenceFile[];
    unlinkedEvidenceIds: string[];
  };
  readiness: {
    advisoryOnly: true;
    doesNotBlockSubmission: true;
    problemDefinition: string;
    containment: string;
    rootCause: string;
    correctiveAction: string;
    verification: string;
    missingInformation: string[];
    risks: string[];
  };
  missingInformation: Array<{
    key: string;
    reason: string;
    stage: string | null;
    answerId: string | null;
  }>;
  risks: string[];
};

type Guidance = {
  sessionId: string;
  question: {
    id: string;
    userFacingQuestion: string;
    explanation?: string | null;
    stage: string;
  } | null;
  progress: { answered: number; total: number };
  followUp: {
    source: "internal_review";
    reason: string;
    questions: string[];
    requestedFieldIds: string[];
  } | null;
  caseSummary: {
    title: string;
    complaintSummary: string;
    dueAt: string;
    participantName: string;
  };
  submission: Submission;
};

const STAGES = [
  "发生了什么？",
  "先控制风险",
  "为什么可能发生？",
  "为什么没发现？",
  "怎样改进？",
  "怎样验证？",
];

const STAGE_LABELS: Record<string, string> = {
  problem_description: "问题情况",
  containment: "先控制风险",
  occurrence_cause: "为什么可能发生",
  escape_cause: "为什么没有发现",
  corrective_action: "怎样改进",
  verification_and_prevention: "怎样验证和防再发",
};

const REQUIREMENT_LABELS: Record<string, string> = {
  traceability_scope: "批次或追溯信息",
  defect_photo: "缺陷照片或视频",
  containment_record: "临时控制记录",
  process_record: "工艺或设备记录",
  inspection_record: "检验记录",
  action_record: "改善措施记录",
  verification_result: "验证结果记录",
};

const READINESS_LABELS: Array<[keyof Submission["readiness"], string]> = [
  ["problemDefinition", "问题说明"],
  ["containment", "临时控制"],
  ["rootCause", "原因调查"],
  ["correctiveAction", "改善措施"],
  ["verification", "验证计划"],
];

function labelStage(stage: string | null) {
  return stage ? STAGE_LABELS[stage] || "调查信息" : "调查信息";
}

function labelRequirement(requirement: string) {
  return REQUIREMENT_LABELS[requirement] || "支持记录";
}

function labelReadiness(status: string) {
  if (status === "complete") return "已记录";
  if (status === "missing_evidence") return "缺少证据";
  if (status === "missing_information") return "仍需补充";
  return "建议人工确认";
}

function formatSize(size: number | null) {
  if (!size) return "文件大小未提供";
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function SupplierSubmissionPanel({
  token,
  sessionId,
  mode,
  submission,
  onChanged,
}: {
  token: string;
  sessionId: string;
  mode: "guided" | "expert";
  submission: Submission;
  onChanged: () => Promise<void>;
}) {
  const [uploadingRequirementId, setUploadingRequirementId] = useState("");
  const [deletingEvidenceId, setDeletingEvidenceId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"submitted" | "duplicate" | "">("");

  async function upload(requirementId: string, file: File | null) {
    if (!file) return;
    setUploadingRequirementId(requirementId);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("sessionId", sessionId);
    form.set("requirementId", requirementId);
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}/evidence`, {
        method: "POST",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "证据上传失败。",
        );
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "证据上传失败，请重试。");
    } finally {
      setUploadingRequirementId("");
    }
  }

  async function removeEvidence(evidenceId: string) {
    setDeletingEvidenceId(evidenceId);
    setError("");
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}/evidence`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, evidenceId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "证据删除失败。",
        );
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "证据删除失败，请重试。");
    } finally {
      setDeletingEvidenceId("");
    }
  }

  async function submitResponse() {
    if (!confirmed || !submission.canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "supplier_submit",
          sessionId,
          mode,
          confirmationText:
            confirmationText.trim() ||
            "我确认以上回答和已关联证据来自本次实际调查；不确定的信息已明确说明。",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "整改回复暂时无法提交。",
        );
      setSuccess(payload.alreadySubmitted ? "duplicate" : "submitted");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "整改回复暂时无法提交，请重试。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="border-emerald-300 bg-emerald-50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 font-semibold text-emerald-950">
            <CheckCircle2 className="size-5" />
            {success === "duplicate" ? "整改回复已经提交" : "整改回复已提交"}
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            内部协调人员将审核这份整改回复、证据和待确认信息。提交不代表根因、措施或验证已经被批准。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mt-6 space-y-5" aria-label="提交整改回复">
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-2">
            <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-indigo-700" />
            <div>
              <h2 className="font-semibold">提交前检查</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                这是帮助你发现还可补充什么的建议，不是 AI 审批，也不会阻止你提交给内部人员审核。
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {READINESS_LABELS.map(([key, label]) => (
              <div key={String(key)} className="flex items-center justify-between rounded border bg-slate-50 px-3 py-2 text-sm">
                <span>{label}</span>
                <span className="text-slate-600">{labelReadiness(submission.readiness[key] as string)}</span>
              </div>
            ))}
          </div>
          {submission.missingInformation.length || submission.risks.length ? (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <div className="flex gap-2 font-medium"><AlertTriangle className="size-4 shrink-0" />还可补充的信息</div>
              <ul className="mt-2 space-y-2 pl-5 leading-6">
                {submission.missingInformation.map((item, index) => (
                  <li key={`${item.key}-${index}`} className="list-disc">
                    <span className="font-medium">{labelStage(item.stage)}：</span>{item.reason}
                  </li>
                ))}
                {submission.risks.map((risk, index) => (
                  <li key={`risk-${index}`} className="list-disc">{risk}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-700">目前没有额外的缺失或风险提示；内部人员仍会进行人工审核。</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-2">
            <FileUp className="mt-0.5 size-5 shrink-0 text-indigo-700" />
            <div>
              <h2 className="font-semibold">补充证据</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                请选择它要支持的调查信息。证据会只关联本次任务，内部人员可审核；不会自动证明改善已经有效。
              </p>
            </div>
          </div>
          {submission.evidence.requirements.length ? (
            <div className="mt-4 space-y-3">
              {submission.evidence.requirements.map((requirement) => {
                const files = submission.evidence.files.filter((file) =>
                  file.requirementIds.includes(requirement.id),
                );
                return (
                  <div key={requirement.id} className="rounded border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{labelRequirement(requirement.requirement)}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">为什么需要：{requirement.reason}</p>
                        <p className="mt-1 text-xs text-slate-500">关联阶段：{labelStage(requirement.stage)} · {files.length ? "已关联" : "暂未关联"}</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50">
                        {uploadingRequirementId === requirement.id ? <LoaderCircle className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                        上传证据
                        <Input
                          className="sr-only"
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          disabled={Boolean(uploadingRequirementId || deletingEvidenceId || submitting)}
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            event.currentTarget.value = "";
                            void upload(requirement.id, file);
                          }}
                        />
                      </label>
                    </div>
                    {files.length ? (
                      <ul className="mt-3 space-y-2">
                        {files.map((file) => (
                          <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-sm">
                            <a
                              className="min-w-0 break-all text-indigo-700 underline"
                              href={`/api/quality-case-tasks/${token}/evidence/${file.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {file.filename} <span className="text-slate-500 no-underline">({formatSize(file.fileSize)})</span>
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={Boolean(deletingEvidenceId || uploadingRequirementId || submitting)}
                              onClick={() => void removeEvidence(file.id)}
                            >
                              {deletingEvidenceId === file.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              删除
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              当前还没有针对这次调查的证据请求。请先继续回答；当回答涉及检验、工艺、措施或验证时，系统会说明为什么需要相应记录。
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">支持 PDF、图片、Word 和 Excel，单个文件不超过 10MB。</p>
        </CardContent>
      </Card>

      <Card className="border-indigo-200">
        <CardContent className="p-5">
          <div className="flex gap-2">
            <Send className="mt-0.5 size-5 shrink-0 text-indigo-700" />
            <div>
              <h2 className="font-semibold">提交整改回复供内部审核</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                你已记录 {submission.answeredQuestions}/{submission.totalQuestions} 项调查内容。提交后由内部协调人员审核；AI 不会代替人确认根因或批准措施。
              </p>
            </div>
          </div>
          {!submission.canSubmit ? <p className="mt-3 text-sm text-amber-700">请先至少回答一项调查问题，再提交给内部审核。</p> : null}
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm leading-6">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={submitting}
            />
            <span>我确认以上回答和已关联证据来自本次实际调查；不确定的信息已经明确说明。</span>
          </label>
          <Textarea
            className="mt-3"
            rows={3}
            value={confirmationText}
            disabled={submitting}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder="可选：补充本次提交说明（不会替代调查回答）"
          />
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-4 flex justify-end">
            <Button
              disabled={!submission.canSubmit || !confirmed || submitting || Boolean(uploadingRequirementId) || Boolean(deletingEvidenceId)}
              onClick={() => void submitResponse()}
            >
              {submitting ? <LoaderCircle className="animate-spin" /> : <Send />}
              提交整改回复供内部审核
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function SupplierGuidedTask({ token }: { token: string }) {
  const [data, setData] = useState<Guidance | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expert, setExpert] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}/guidance`, {
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof result.error === "string" ? result.error : "任务链接不可用",
        );
      setData(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "任务链接不可用");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveAnswer() {
    if (!data?.question || !answer.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/quality-case-tasks/${token}/guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: data.sessionId,
          questionId: data.question.id,
          answer,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof result.error === "string" ? result.error : "保存失败",
        );
      setAnswer("");
      setNotice(
        result.aiUnavailable
          ? "回答已保存。AI助手暂时不可用，系统会继续按下一项事实信息引导；不会把回答当作已确认结论。"
          : "已记录。AI质量工程师正在根据这项回答准备下一步问题。",
      );
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-4 animate-spin" />
        正在准备调查…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <h1 className="font-semibold">任务链接不可用</h1>
            <p className="mt-2 text-sm text-slate-600">{error || "请检查链接是否已过期或已完成。"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = data.caseSummary;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">Q</span>
            质量整改助手
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpert(!expert)}>
            <FileText /> {expert ? "返回引导模式" : "切换专业模式"}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-7">
        <div className="mb-6 grid gap-3 rounded-2xl bg-indigo-700 p-5 text-white md:grid-cols-4">
          <div><p className="text-xs text-indigo-200">质量整改请求</p><p className="mt-1 font-semibold">{summary.title}</p></div>
          <div><p className="text-xs text-indigo-200">问题摘要</p><p className="mt-1 line-clamp-2 text-sm">{summary.complaintSummary}</p></div>
          <div><p className="text-xs text-indigo-200">回复截止</p><p className="mt-1 text-sm">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(summary.dueAt))}</p></div>
          <div><p className="text-xs text-indigo-200">预计完成</p><p className="mt-1 text-sm">约 15 分钟</p></div>
        </div>

        {data.followUp ? (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold text-amber-950"><ClipboardList className="size-5" />内部审核需要你补充以下信息</div>
              <p className="mt-2 text-sm leading-6 text-amber-900">{data.followUp.reason}</p>
              <ol className="mt-3 space-y-2 pl-5 text-sm leading-6 text-amber-950">
                {data.followUp.questions.map((question, index) => <li key={`${index}-${question}`} className="list-decimal">{question}</li>)}
              </ol>
              <p className="mt-3 text-xs text-amber-800">请继续按下方问题提供事实；不确定的信息可以明确写“需要核实”。</p>
            </CardContent>
          </Card>
        ) : null}

        {expert ? (
          <Card>
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold">专业审阅模式</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                这里显示同一份已保存的调查事实。为了保持可审计性，提交时仍使用下方同一份 Supplier Response Package；请在引导模式补充尚未记录的事实。
              </p>
              <div className="mt-5 space-y-3">
                {data.submission.currentAnswers.length ? data.submission.currentAnswers.map((item) => (
                  <div key={item.id} className="rounded border p-3">
                    <p className="text-sm font-medium">{labelStage(item.stage)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.text}</p>
                  </div>
                )) : <p className="rounded bg-slate-50 p-3 text-sm text-slate-600">尚未记录调查回答。请返回引导模式开始填写。</p>}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)_15rem]">
            <aside>
              <p className="text-sm font-medium">调查进度</p>
              {STAGES.map((item, index) => (
                <div key={item} className={`mt-3 flex gap-2 text-sm ${index < data.progress.answered ? "text-emerald-700" : "text-slate-500"}`}>
                  <CheckCircle2 className="size-4" />{item}
                </div>
              ))}
            </aside>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-indigo-700"><Bot className="size-5" /><span className="text-sm font-medium">AI 质量工程师</span></div>
                <h1 className="mt-4 text-2xl font-semibold">{data.question?.userFacingQuestion || "调查问题已完成，可以检查证据并提交。"}</h1>
                {data.question?.explanation ? <p className="mt-3 border-l-2 border-indigo-200 pl-3 text-sm leading-6 text-slate-600">为什么需要这个信息：{data.question.explanation}</p> : null}
                {data.question ? <>
                  <Textarea className="mt-6" rows={7} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="请用自己的话说明实际情况；不确定的信息可以写“需要核实”。" />
                  <p className="mt-2 text-xs text-slate-500">示例：说明发生位置、时间、范围或现有记录。请勿猜测根因、数量或测试结果。</p>
                  {notice ? <p className="mt-3 text-sm text-amber-700">{notice}</p> : null}
                  <div className="mt-5 flex justify-end"><Button disabled={saving || !answer.trim()} onClick={() => void saveAnswer()}>{saving ? <LoaderCircle className="animate-spin" /> : <ChevronRight />}继续回答</Button></div>
                </> : <p className="mt-4 text-sm leading-6 text-slate-600">请阅读下方的提交前检查。即使仍有提示，也可以如实提交给内部人员审核。</p>}
              </CardContent>
            </Card>
            <aside><Card><CardContent className="p-5"><div className="flex gap-2 font-medium"><LockKeyhole className="size-4 text-indigo-600" />你的整改摘要</div><p className="mt-4 text-sm text-slate-600">已完成 {data.progress.answered}/{data.progress.total} 个阶段。</p><div className="mt-4 border-t pt-4 text-xs leading-5 text-slate-500">内部备注、商务信息和其他供应商数据不会显示。</div></CardContent></Card></aside>
          </div>
        )}

        <SupplierSubmissionPanel token={token} sessionId={data.sessionId} mode={expert ? "expert" : "guided"} submission={data.submission} onChanged={load} />
      </main>
    </div>
  );
}
