"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalTaskComposer } from "@/components/quality-cases/ExternalTaskComposer";
import { WorkflowActionPanel } from "@/components/quality-cases/WorkflowActionPanel";
import { OutputComposer } from "@/components/quality-cases/OutputComposer";
import { BilingualContentPanel } from "@/components/quality-cases/BilingualContentPanel";
import { ExternalTaskLinks } from "@/components/quality-cases/ExternalTaskLinks";
import { AssigneeSelector } from "@/components/quality-cases/AssigneeSelector";
import { InternalQualityReviewWorkspace } from "@/components/quality-cases/InternalQualityReviewWorkspace";
import { EffectivenessVerificationWorkspace } from "@/components/quality-cases/EffectivenessVerificationWorkspace";

const FLOW = [
  "draft",
  "waiting_for_supplier",
  "supplier_submitted",
  "internal_review",
  "changes_requested_from_supplier",
  "ready_for_customer",
  "customer_review",
  "changes_requested_by_customer",
  "customer_accepted",
  "verification_planning",
  "verification_in_progress",
  "verification_submitted",
  "internal_verification_review",
  "verified_effective",
  "effectiveness_verification",
  "closed",
  "reopened",
];
const STATUS: Record<string, string> = {
  draft: "草稿",
  waiting_for_supplier: "等待供应商",
  supplier_submitted: "供应商已提交",
  internal_review: "内部审核",
  changes_requested_from_supplier: "已退回供应商",
  ready_for_customer: "待发送客户",
  customer_review: "等待客户",
  changes_requested_by_customer: "客户要求修改",
  customer_accepted: "客户已接受",
  verification_planning: "验证计划",
  verification_in_progress: "验证执行中",
  verification_submitted: "验证已提交",
  internal_verification_review: "内部验证审核",
  verified_effective: "已确认有效",
  effectiveness_verification: "有效性验证",
  closed: "已关闭",
  reopened: "已重新打开",
};
const ACTIONS: Record<string, string> = {
  case_created: "创建案例",
  send_to_supplier: "发送供应商任务",
  supplier_submit: "供应商提交",
  start_internal_review: "开始内部审核",
  request_supplier_changes: "退回供应商修改",
  mark_ready_for_customer: "标记为待客户审核",
  send_to_customer_review: "发送客户审核",
  request_customer_changes: "客户要求修改",
  customer_accept: "客户接受",
  start_effectiveness_verification: "开始有效性验证",
  begin_verification_planning: "迁移旧验证计划",
  start_verification_execution: "开始验证执行",
  submit_verification: "提交验证结果",
  start_verification_review: "开始验证审核",
  approve_verification: "批准验证",
  request_verification_evidence: "要求补充验证证据",
  mark_verification_failed: "验证失败并重开",
  close_case: "关闭案例",
  reopen_case: "重新打开案例",
  assignee_changed: "更新负责人",
  mapping_confirmed: "确认客户信息映射",
};

type Detail = {
  qualityCase: {
    id: string;
    title: string;
    status: string;
    outputType: string;
    waitingOn: string;
    nextAction: string;
    dueAt: string | null;
    currentVersion: number;
    caseData: Record<string, unknown>;
  };
  role: string;
  canManageWorkflow: boolean;
  canAssignExternalTasks: boolean;
  assignee: { userId: string; displayName: string } | null;
  assignees: Array<{ userId: string; displayName: string }>;
  participants: Array<{
    id: string;
    role: string;
    displayName: string;
    organizationName: string | null;
  }>;
  activities: Array<{
    id: string;
    version: number;
    actionType: string;
    actorId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    actorRole: string;
    actorOrganization: string | null;
    comment: string | null;
    requestedFieldIds: string[];
    dueAt: string | null;
    diff: Record<string, { before: unknown; after: unknown }>;
    evidenceIds: string[];
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
  evidence: Array<{
    id: string;
    filename: string;
    mimeType: string | null;
    fileSize: number | null;
    visibility: string;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    taskType: string;
    expiresAt: string;
    revokedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    participantName: string | null;
    participantOrganization: string | null;
  }>;
};

function date(value: string | null, withTime = false) {
  if (!value) return "未设置";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "未设置"
    : new Intl.DateTimeFormat(
        "zh-CN",
        withTime
          ? { dateStyle: "medium", timeStyle: "short" }
          : { year: "numeric", month: "long", day: "numeric" },
      ).format(parsed);
}

function dueSignal(value: string | null) {
  if (!value) return null;
  const dueAt = new Date(value);
  if (Number.isNaN(dueAt.getTime())) return null;
  const days = Math.ceil((dueAt.getTime() - Date.now()) / 86_400_000);
  if (days < 0)
    return { label: `已逾期 ${Math.abs(days)} 天`, className: "text-rose-700" };
  if (days === 0) return { label: "今天到期", className: "text-amber-700" };
  if (days <= 3) return { label: `${days} 天内到期`, className: "text-amber-700" };
  return { label: "未逾期", className: "text-emerald-700" };
}

function diffValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 280 ? `${text.slice(0, 277)}…` : text;
}

function activityActorName(activity: Detail["activities"][number]) {
  if (activity.actorName?.trim()) return activity.actorName;
  if (activity.actorEmail?.trim()) return activity.actorEmail;
  const externalActor =
    activity.metadata && typeof activity.metadata.actorName === "string"
      ? activity.metadata.actorName.trim()
      : "";
  if (externalActor) return externalActor;
  if (activity.actorRole === "supplier") return "供应商外部人员";
  if (activity.actorRole === "customer") return "客户外部人员";
  return "未记录操作人";
}

export function QualityCaseDetail({ caseId }: { caseId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quality-cases/${caseId}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "无法加载案例详情",
        );
      setDetail(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "无法加载案例详情",
      );
    } finally {
      setLoading(false);
    }
  }, [caseId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading)
    return (
      <div className="flex min-h-96 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-4 animate-spin" />
        正在加载案例…
      </div>
    );
  if (error || !detail)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <h1 className="font-semibold text-amber-950">
              无法加载 Quality Case
            </h1>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {error || "该案例不存在或你没有访问权限。"}
            </p>
            <Link href="/cases" className="mt-4 inline-flex">
              <Button variant="outline">返回案例列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  const qualityCase = detail.qualityCase;
  const evidenceById = new Map(detail.evidence.map((evidence) => [evidence.id, evidence]));
  const due = dueSignal(qualityCase.dueAt);
  const complaintSummary =
    typeof qualityCase.caseData.complaintSummary === "string"
      ? qualityCase.caseData.complaintSummary
      : typeof qualityCase.caseData.problemDescription === "string"
        ? qualityCase.caseData.problemDescription
        : "";
  const current = FLOW.indexOf(qualityCase.status);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-700"
      >
        <ArrowLeft className="size-4" />
        返回质量案例
      </Link>
      <section className="mt-5 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-indigo-200 bg-indigo-50 text-indigo-800"
            >
              {qualityCase.outputType.toUpperCase()}
            </Badge>
            <Badge variant="outline">版本 {qualityCase.currentVersion}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {qualityCase.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            内部权限：
            {detail.role === "owner"
              ? "协调方负责人"
              : detail.role === "editor"
                ? "内部成员"
                : "只读成员"}
          </p>
        </div>
        <div className="grid min-w-70 grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <div>
            <div className="text-slate-500">当前等待</div>
            <div className="mt-1 font-medium text-slate-950">
              {qualityCase.waitingOn === "supplier"
                ? "供应商"
                : qualityCase.waitingOn === "customer"
                  ? "客户"
                  : qualityCase.waitingOn === "none"
                    ? "—"
                    : "内部团队"}
            </div>
          </div>
          <div>
            <div className="text-slate-500">截止日期</div>
            <div className="mt-1 font-medium text-slate-950">
              {date(qualityCase.dueAt)}
            </div>
            {due ? (
              <div className={`mt-1 text-xs font-medium ${due.className}`}>
                {due.label}
              </div>
            ) : null}
          </div>
          <div>
            <div className="text-slate-500">负责人</div>
            <div className="mt-1 font-medium text-slate-950">
              {detail.assignee?.displayName || "未分配"}
            </div>
          </div>
        </div>
      </section>
      {qualityCase.status === "supplier_submitted" ||
      qualityCase.status === "internal_review" ? (
        <InternalQualityReviewWorkspace
          caseId={qualityCase.id}
          onChanged={() => void load()}
        />
      ) : null}
      <EffectivenessVerificationWorkspace
        caseId={qualityCase.id}
        status={qualityCase.status}
        owner={detail.assignee?.displayName || "未分配"}
        dueAt={qualityCase.dueAt}
        product={typeof qualityCase.caseData.product === "string" ? qualityCase.caseData.product : ""}
        onChanged={() => void load()}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-slate-950">当前工作流</h2>
              <p className="mt-1 text-sm text-slate-600">
                每个状态都明确其等待方和下一步。
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {FLOW.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-lg border p-3 ${step === qualityCase.status ? "border-indigo-300 bg-indigo-50" : index < current && qualityCase.status !== "reopened" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      {index < current && qualityCase.status !== "reopened" ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span
                          className={`size-2 rounded-full ${step === qualityCase.status ? "bg-indigo-600" : "bg-slate-300"}`}
                        />
                      )}
                      {STATUS[step]}
                    </div>
                    {step === qualityCase.status ? (
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {qualityCase.nextAction}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-950">证据与附件</h2>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                仅内部成员可下载未授权给客户的供应商证据。
              </p>
              <div className="mt-4 space-y-2">
                {detail.evidence.length ? (
                  detail.evidence.map((item) => (
                    <a
                      key={item.id}
                      href={`/api/quality-case-evidence/${item.id}`}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                    >
                      <span className="truncate">{item.filename}</span>
                      <span className="ml-3 shrink-0 text-xs text-slate-500">
                        {item.fileSize
                          ? `${Math.ceil(item.fileSize / 1024)} KB`
                          : "文件"}
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">尚未提交证据附件。</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-slate-950">审计时间线</h2>
              <p className="mt-1 text-sm text-slate-600">
                状态变更、意见和版本永久关联。
              </p>
              <div className="mt-5 space-y-5">
                {detail.activities.length ? (
                  detail.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-indigo-500" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-950">
                            {ACTIONS[activity.actionType] ||
                              activity.actionType}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            v{activity.version}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {activityActorName(activity)} · {activity.actorOrganization || "未记录组织"} ·{" "}
                          {date(activity.createdAt, true)}
                        </p>
                        {activity.comment ? (
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {activity.comment}
                          </p>
                        ) : null}
                        {activity.requestedFieldIds.length ? (
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            <span className="font-medium text-slate-700">要求修改字段：</span>{" "}
                            {activity.requestedFieldIds.join("、")}
                          </p>
                        ) : null}
                        {activity.dueAt ? (
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            <span className="font-medium text-slate-700">对应截止日期：</span>{date(activity.dueAt, true)}
                          </p>
                        ) : null}
                        {activity.evidenceIds.length ? (
                          <div className="mt-2 text-xs leading-5 text-slate-600">
                            <span className="font-medium text-slate-700">关联证据：</span>{" "}
                            {activity.evidenceIds.map((evidenceId) => {
                              const evidence = evidenceById.get(evidenceId);
                              return evidence ? (
                                <a
                                  key={evidenceId}
                                  className="mr-2 text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
                                  href={`/api/quality-case-evidence/${evidenceId}`}
                                >
                                  {evidence.filename}
                                </a>
                              ) : (
                                <span key={evidenceId} className="mr-2">已移除或不可用证据</span>
                              );
                            })}
                          </div>
                        ) : null}
                        {Object.entries(activity.diff || {}).length ? (
                          <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                            <p className="font-medium text-slate-700">修改差异</p>
                            {Object.entries(activity.diff).map(([field, change]) => (
                              <p key={field} className="mt-1 break-words">
                                <span className="font-medium text-slate-700">{field}</span>
                                {"："}{diffValue(change.before)} {" → "}{diffValue(change.after)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">暂无活动记录。</p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-slate-950">
                <CalendarClock className="size-4 text-indigo-600" />
                <h2 className="font-semibold">下一步</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {qualityCase.nextAction}
              </p>
              <AssigneeSelector
                caseId={qualityCase.id}
                currentAssignee={detail.assignee}
                assignees={detail.assignees}
                canAssign={detail.canManageWorkflow}
                onChanged={() => void load()}
              />
              <ExternalTaskComposer
                caseId={qualityCase.id}
                status={qualityCase.status}
              />
              <ExternalTaskLinks
                caseId={qualityCase.id}
                tasks={detail.tasks}
                canRevoke={detail.canAssignExternalTasks}
                onChanged={() => void load()}
              />
              {qualityCase.status !== "supplier_submitted" &&
              qualityCase.status !== "internal_review" &&
              !["customer_accepted", "effectiveness_verification", "verification_planning", "verification_in_progress", "verification_submitted", "internal_verification_review", "verified_effective"].includes(qualityCase.status) ? (
                <WorkflowActionPanel
                  caseId={qualityCase.id}
                  status={qualityCase.status}
                  canManageWorkflow={detail.canManageWorkflow}
                  onChanged={() => void load()}
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <UsersRound className="size-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-950">参与方</h2>
              </div>
              <div className="mt-4 space-y-3">
                {detail.participants.map((participant) => (
                  <div key={participant.id}>
                    <div className="text-sm font-medium text-slate-950">
                      {participant.displayName}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {participant.role === "coordinator"
                        ? "协调方"
                        : participant.role}{" "}
                      · {participant.organizationName || "未记录组织"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-950">输出模块</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                现有 8D 编辑器和导出保留为 Case
                的兼容输出模块；历史报告不会被重写。
              </p>
              <OutputComposer
                caseId={qualityCase.id}
                outputType={qualityCase.outputType}
              />
              <BilingualContentPanel
                caseId={qualityCase.id}
                initialOriginals={{ complaint_summary: complaintSummary }}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
