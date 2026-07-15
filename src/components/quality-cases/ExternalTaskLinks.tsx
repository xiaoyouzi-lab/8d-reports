"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Clock3, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ExternalTask = {
  id: string;
  taskType: string;
  expiresAt: string;
  revokedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  participantName: string | null;
  participantOrganization: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "未设置"
    : new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function taskState(task: ExternalTask) {
  if (task.revokedAt) return { label: "已撤销", className: "text-slate-500", active: false };
  if (task.completedAt) return { label: "已完成", className: "text-emerald-700", active: false };
  if (new Date(task.expiresAt).getTime() <= Date.now())
    return { label: "已过期", className: "text-amber-700", active: false };
  return { label: "链接有效", className: "text-indigo-700", active: true };
}

export function ExternalTaskLinks({
  caseId,
  tasks,
  canRevoke,
  onChanged,
}: {
  caseId: string;
  tasks: ExternalTask[];
  canRevoke: boolean;
  onChanged: () => void;
}) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const revoke = async (task: ExternalTask) => {
    if (!confirm("撤销后，此外部链接将立即失效且无法恢复。是否继续？")) return;
    setRevokingId(task.id);
    try {
      const response = await fetch(
        `/api/quality-cases/${caseId}/tasks/${task.id}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "无法撤销链接",
        );
      toast.success("外部任务链接已撤销");
      onChanged();
    } catch (error) {
      toast.error("未能撤销外部任务链接", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRevokingId(null);
    }
  };

  if (!tasks.length) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
        <ShieldCheck className="size-4 text-indigo-600" />
        外部任务链接
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        为安全起见，原始链接仅在创建时显示一次；这里仅显示其状态与可撤销控制。
      </p>
      <div className="mt-3 space-y-2">
        {tasks.map((task) => {
          const state = taskState(task);
          return (
            <div key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {task.taskType === "customer_review" ? "客户审核" : "供应商回复"}
                    {task.participantName ? ` · ${task.participantName}` : ""}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {task.participantOrganization || "未记录组织"} · 到期：{formatDate(task.expiresAt)}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-medium ${state.className}`}>
                  {state.label}
                </span>
              </div>
              {canRevoke && state.active ? (
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  disabled={revokingId === task.id}
                  onClick={() => void revoke(task)}
                >
                  {revokingId === task.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Ban className="size-3.5" />
                  )}
                  撤销链接
                </Button>
              ) : task.completedAt ? (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="size-3.5" /> 已保留完成审计记录
                </span>
              ) : (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="size-3.5" /> 无需进一步操作
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
