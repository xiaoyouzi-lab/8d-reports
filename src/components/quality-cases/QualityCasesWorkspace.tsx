"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilePlus2,
  ListChecks,
  LoaderCircle,
  Plus,
  Send,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type QueueSummary = {
  awaitingInternalReview: number;
  waitingForSupplier: number;
  waitingForCustomer: number;
  returned: number;
  dueSoon: number;
  overdue: number;
  effectivenessVerification: number;
  closed: number;
};

type QualityCase = {
  id: string;
  title: string;
  status: string;
  outputType: string;
  priority: string;
  waitingOn: string;
  nextAction: string;
  assigneeUserId: string | null;
  dueAt: string | null;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_SUMMARY: QueueSummary = {
  awaitingInternalReview: 0,
  waitingForSupplier: 0,
  waitingForCustomer: 0,
  returned: 0,
  dueSoon: 0,
  overdue: 0,
  effectivenessVerification: 0,
  closed: 0,
};

const STATUS_LABELS: Record<string, string> = {
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

const STATUS_STYLE: Record<string, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  waiting_for_supplier: "border-amber-200 bg-amber-50 text-amber-800",
  supplier_submitted: "border-sky-200 bg-sky-50 text-sky-800",
  internal_review: "border-violet-200 bg-violet-50 text-violet-800",
  changes_requested_from_supplier: "border-rose-200 bg-rose-50 text-rose-800",
  ready_for_customer: "border-indigo-200 bg-indigo-50 text-indigo-800",
  customer_review: "border-purple-200 bg-purple-50 text-purple-800",
  changes_requested_by_customer: "border-rose-200 bg-rose-50 text-rose-800",
  customer_accepted: "border-teal-200 bg-teal-50 text-teal-800",
  verification_planning: "border-cyan-200 bg-cyan-50 text-cyan-800",
  verification_in_progress: "border-cyan-200 bg-cyan-50 text-cyan-800",
  verification_submitted: "border-violet-200 bg-violet-50 text-violet-800",
  internal_verification_review: "border-violet-200 bg-violet-50 text-violet-800",
  verified_effective: "border-emerald-200 bg-emerald-50 text-emerald-800",
  effectiveness_verification: "border-cyan-200 bg-cyan-50 text-cyan-800",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  reopened: "border-orange-200 bg-orange-50 text-orange-800",
};

const WAITING_ON_LABELS: Record<string, string> = {
  internal: "内部团队",
  supplier: "供应商",
  customer: "客户",
  none: "—",
};

const OUTPUT_LABELS: Record<string, string> = {
  "8d": "8D",
  scar: "SCAR",
  car: "CAR",
  capa: "CAPA",
  ncr_response: "NCR 回复",
  corrective_action_report: "纠正措施报告",
};

function formatDueDate(value: string | null) {
  if (!value) return "未设置";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未设置";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function dueState(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days < 0)
    return { text: `已逾期 ${Math.abs(days)} 天`, className: "text-rose-700" };
  if (days <= 3)
    return {
      text: `${days === 0 ? "今天到期" : `${days} 天内到期`}`,
      className: "text-amber-700",
    };
  return null;
}

function QueueCard({
  label,
  count,
  description,
  icon: Icon,
  className,
}: {
  label: string;
  count: number;
  description: string;
  icon: typeof Clock3;
  className: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-31 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              className,
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-slate-950">
            {count}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function QualityCasesWorkspace() {
  const searchParams = useSearchParams();
  const claimTask = searchParams.get("claimTask");
  const createRequested = searchParams.get("create") === "1";
  const [cases, setCases] = useState<QualityCase[]>([]);
  const [summary, setSummary] = useState<QueueSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [outputType, setOutputType] = useState("8d");
  const [dueAt, setDueAt] = useState("");

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/quality-cases", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "无法加载质量案例",
        );
      setCases(Array.isArray(payload.cases) ? payload.cases : []);
      setSummary({ ...EMPTY_SUMMARY, ...(payload.summary || {}) });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "无法加载质量案例",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCases();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCases]);

  useEffect(() => {
    if (!claimTask) return;
    fetch(`/api/quality-case-tasks/${encodeURIComponent(claimTask)}/claim`, {
      method: "POST",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result)
          toast.success("已认领外部任务，可创建自己的 Quality Case。");
      })
      .catch(() => {});
  }, [claimTask]);

  useEffect(() => {
    if (!createRequested) return;
    const timer = window.setTimeout(() => setCreateOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [createRequested]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/quality-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          coordinatorOrganization: organization,
          outputType,
          dueAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "无法创建质量案例",
        );
      toast.success("质量案例已创建", {
        description: "下一步：补充投诉信息并分配供应商任务。",
      });
      setTitle("");
      setOrganization("");
      setOutputType("8d");
      setDueAt("");
      setCreateOpen(false);
      await loadCases();
    } catch (createError) {
      toast.error("未能创建质量案例", {
        description:
          createError instanceof Error ? createError.message : "请稍后重试",
      });
    } finally {
      setCreating(false);
    }
  };

  const visibleCases = useMemo(() => cases.slice(0, 50), [cases]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="border-b border-slate-200 pb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
              <ListChecks className="size-4" />
              Quality Cases
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              质量案例协作
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              从客户投诉到供应商整改、客户审核和有效性验证，在同一个可审计流程中协作。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/reports/new">
              <Button variant="outline">
                <FilePlus2 className="size-4" />
                新建 8D 报告
              </Button>
            </Link>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setCreateOpen((open) => !open)}
            >
              <Plus className="size-4" />
              新建质量案例
            </Button>
          </div>
        </div>

        {createOpen ? (
          <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-950">
                  创建 Quality Case
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  先建立协作边界；投诉、证据和外部任务将在后续步骤中补全。
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-indigo-200 bg-white text-indigo-700"
              >
                草稿
              </Badge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5 xl:col-span-2">
                <Label htmlFor="case-title">案例标题 *</Label>
                <Input
                  id="case-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例如：连接器镀层厚度超差"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="case-organization">协调方组织 *</Label>
                <Input
                  id="case-organization"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  placeholder="例如：宁波贸易有限公司"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="case-due">首次回复截止日</Label>
                <Input
                  id="case-due"
                  type="date"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>输出类型</Label>
                <Select
                  value={outputType}
                  onValueChange={(value) => setOutputType(value || "8d")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8d">8D</SelectItem>
                    <SelectItem value="scar">SCAR</SelectItem>
                    <SelectItem value="car">CAR</SelectItem>
                    <SelectItem value="capa">CAPA</SelectItem>
                    <SelectItem value="ncr_response">NCR 回复</SelectItem>
                    <SelectItem value="corrective_action_report">
                      纠正措施报告
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                取消
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleCreate}
                disabled={creating || !title.trim() || !organization.trim()}
              >
                {creating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
                {creating ? "正在创建" : "创建案例"}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">当前队列</h2>
            <p className="mt-1 text-sm text-slate-600">
              优先处理正在等待某一方行动的案例。
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void loadCases()}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              "刷新"
            )}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QueueCard
            label="待我审核"
            count={summary.awaitingInternalReview}
            description="内部团队需要决定下一步"
            icon={UserRoundCheck}
            className="bg-violet-100 text-violet-700"
          />
          <QueueCard
            label="等待供应商"
            count={summary.waitingForSupplier}
            description="供应商填写整改并提交证据"
            icon={UsersRound}
            className="bg-amber-100 text-amber-700"
          />
          <QueueCard
            label="等待客户"
            count={summary.waitingForCustomer}
            description="客户正在审核授权的答复"
            icon={Send}
            className="bg-purple-100 text-purple-700"
          />
          <QueueCard
            label="已被打回"
            count={summary.returned}
            description="含供应商或客户的修改要求"
            icon={CircleAlert}
            className="bg-rose-100 text-rose-700"
          />
          <QueueCard
            label="即将逾期"
            count={summary.dueSoon}
            description="未来 3 天内到期"
            icon={Clock3}
            className="bg-orange-100 text-orange-700"
          />
          <QueueCard
            label="已逾期"
            count={summary.overdue}
            description="需要重新确认责任人与期限"
            icon={AlertCircle}
            className="bg-rose-100 text-rose-700"
          />
          <QueueCard
            label="待有效性验证"
            count={summary.effectivenessVerification}
            description="客户接受后仍需内部验证"
            icon={ListChecks}
            className="bg-cyan-100 text-cyan-700"
          />
          <QueueCard
            label="已关闭"
            count={summary.closed}
            description="保留版本、证据和完整审计记录"
            icon={CheckCircle2}
            className="bg-emerald-100 text-emerald-700"
          />
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="font-semibold text-slate-950">质量案例</h2>
          <p className="text-sm text-slate-600">
            状态、等待方、下一步、负责人和期限始终保持可见。
          </p>
        </div>
        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="size-4 animate-spin" />
            正在加载案例…
          </div>
        ) : error ? (
          <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Quality Cases 当前不可用。</strong>
            <p className="mt-1 leading-6">{error}</p>
            <p className="mt-2 leading-6">
              如果这是首次部署，请先在隔离数据库应用
              `0008_quality_case_foundation.sql`，验证后再启用此工作区。
            </p>
          </div>
        ) : visibleCases.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ListChecks className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-950">
              还没有质量案例
            </h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
              创建一个
              Case，记录投诉、协调方和首次回复期限；之后再邀请供应商或客户完成指定任务。
            </p>
            <Button
              className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              创建第一个案例
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-5">案例</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">等待方</th>
                  <th className="px-4 py-3">下一步</th>
                  <th className="px-4 py-3">截止日期</th>
                  <th className="px-4 py-3">输出</th>
                  <th className="px-4 py-3" aria-label="操作" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCases.map((qualityCase) => {
                  const due = dueState(qualityCase.dueAt);
                  return (
                    <tr
                      key={qualityCase.id}
                      className="group hover:bg-slate-50/80"
                    >
                      <td className="max-w-70 px-4 py-4 sm:px-5">
                        <div className="font-medium text-slate-950">
                          {qualityCase.title}
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-500">
                          版本 {qualityCase.currentVersion} ·{" "}
                          {qualityCase.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            STATUS_STYLE[qualityCase.status] ||
                              STATUS_STYLE.draft,
                          )}
                        >
                          {STATUS_LABELS[qualityCase.status] ||
                            qualityCase.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {WAITING_ON_LABELS[qualityCase.waitingOn] || "内部团队"}
                      </td>
                      <td className="max-w-75 px-4 py-4 text-slate-600">
                        <span className="line-clamp-2">
                          {qualityCase.nextAction}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-700">
                          {formatDueDate(qualityCase.dueAt)}
                        </div>
                        {due ? (
                          <div
                            className={cn(
                              "mt-1 text-xs font-medium",
                              due.className,
                            )}
                          >
                            {due.text}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {OUTPUT_LABELS[qualityCase.outputType] ||
                          qualityCase.outputType}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled
                          aria-label="案例详情即将推出"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
