"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Send,
  Undo2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type QueueCardProps = {
  label: string;
  value: number;
  description: string;
  icon: typeof Clock3;
  tone: string;
};

function QueueCard({ label, value, description, icon: Icon, tone }: QueueCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className={cn("flex size-7 items-center justify-center rounded-md", tone)}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 min-h-8 text-[11px] leading-4 text-slate-500">{description}</p>
    </div>
  );
}

export function DashboardQualityCaseSummary() {
  const locale = useLocale();
  const isChinese = locale === "zh-CN";
  const [summary, setSummary] = useState<QueueSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/quality-cases", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("Unable to load Quality Cases");
      setSummary({ ...EMPTY_SUMMARY, ...(payload.summary || {}) });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSummary(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);

  const cards: QueueCardProps[] = isChinese
    ? [
        { label: "待我审核", value: summary.awaitingInternalReview, description: "供应商提交或内部待处理", icon: ClipboardCheck, tone: "bg-violet-100 text-violet-700" },
        { label: "等待供应商", value: summary.waitingForSupplier, description: "供应商需提交调查或证据", icon: UsersRound, tone: "bg-amber-100 text-amber-700" },
        { label: "等待客户", value: summary.waitingForCustomer, description: "客户等待审核或确认", icon: UserRoundCheck, tone: "bg-indigo-100 text-indigo-700" },
        { label: "已被打回", value: summary.returned, description: "需根据修改要求再次提交", icon: Undo2, tone: "bg-rose-100 text-rose-700" },
        { label: "即将逾期", value: summary.dueSoon, description: "未来 3 天内到期", icon: Clock3, tone: "bg-orange-100 text-orange-700" },
        { label: "已逾期", value: summary.overdue, description: "需要立即跟进", icon: AlertTriangle, tone: "bg-red-100 text-red-700" },
        { label: "待有效性验证", value: summary.effectivenessVerification, description: "客户接受后仍需验证", icon: Send, tone: "bg-cyan-100 text-cyan-700" },
        { label: "已关闭", value: summary.closed, description: "已完成整个纠正措施闭环", icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
      ]
    : [
        { label: "Awaiting my review", value: summary.awaitingInternalReview, description: "Supplier or internal work needs review", icon: ClipboardCheck, tone: "bg-violet-100 text-violet-700" },
        { label: "Waiting for supplier", value: summary.waitingForSupplier, description: "Investigation or evidence is needed", icon: UsersRound, tone: "bg-amber-100 text-amber-700" },
        { label: "Waiting for customer", value: summary.waitingForCustomer, description: "Customer review or confirmation is pending", icon: UserRoundCheck, tone: "bg-indigo-100 text-indigo-700" },
        { label: "Changes requested", value: summary.returned, description: "A revised response is required", icon: Undo2, tone: "bg-rose-100 text-rose-700" },
        { label: "Due soon", value: summary.dueSoon, description: "Due within the next 3 days", icon: Clock3, tone: "bg-orange-100 text-orange-700" },
        { label: "Overdue", value: summary.overdue, description: "Needs immediate follow-up", icon: AlertTriangle, tone: "bg-red-100 text-red-700" },
        { label: "Effectiveness verification", value: summary.effectivenessVerification, description: "Customer acceptance is not closure", icon: Send, tone: "bg-cyan-100 text-cyan-700" },
        { label: "Closed", value: summary.closed, description: "Corrective-action loop is complete", icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
      ];

  return (
    <section className="mb-6 rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-white p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            <ClipboardCheck className="size-3.5" />
            {isChinese ? "Quality Case 协作" : "Quality Case collaboration"}
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            {isChinese ? "先处理正在等待你的质量事项" : "Start with the quality work waiting on you"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {isChinese
              ? "从客户投诉到供应商证据、客户接受和有效性验证，Quality Case 保留完整责任与审计记录。"
              : "Quality Cases keep ownership and an audit trail from customer complaint through supplier evidence, customer acceptance, and effectiveness verification."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/cases?create=1">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
              {isChinese ? "新建 Quality Case" : "New Quality Case"}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/cases">
            <Button size="sm" variant="outline">
              {isChinese ? "查看全部事项" : "View all cases"}
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {isChinese ? "暂时无法加载 Quality Case 队列。请稍后重试。" : "Quality Case queues are temporarily unavailable. Please try again shortly."}
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <QueueCard key={card.label} {...card} value={loading ? 0 : card.value} />
          ))}
        </div>
      )}
    </section>
  );
}
