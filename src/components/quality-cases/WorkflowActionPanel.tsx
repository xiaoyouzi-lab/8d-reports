"use client";

import { useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = {
  id: string;
  label: string;
  kind: "primary" | "outline";
  requiresComment?: boolean;
  requiresFields?: boolean;
  requiresDue?: boolean;
};
const ACTIONS: Record<string, Action[]> = {
  draft: [
    { id: "start_internal_review", label: "开始内部审核", kind: "primary" },
  ],
  supplier_submitted: [
    {
      id: "start_internal_review",
      label: "开始审核供应商答复",
      kind: "primary",
    },
  ],
  internal_review: [
    {
      id: "mark_ready_for_customer",
      label: "标记为可发送客户",
      kind: "primary",
    },
    {
      id: "request_supplier_changes",
      label: "退回供应商修改",
      kind: "outline",
      requiresComment: true,
      requiresFields: true,
      requiresDue: true,
    },
  ],
  changes_requested_by_customer: [
    { id: "start_internal_review", label: "处理客户修改要求", kind: "primary" },
  ],
  customer_accepted: [
    {
      id: "start_effectiveness_verification",
      label: "开始有效性验证",
      kind: "primary",
    },
  ],
  effectiveness_verification: [],
  closed: [
    {
      id: "reopen_case",
      label: "重新打开案例",
      kind: "outline",
      requiresComment: true,
    },
  ],
  reopened: [
    { id: "start_internal_review", label: "重新开始内部审核", kind: "primary" },
  ],
};

export function WorkflowActionPanel({
  caseId,
  status,
  canManageWorkflow,
  onChanged,
}: {
  caseId: string;
  status: string;
  canManageWorkflow: boolean;
  onChanged: () => void;
}) {
  const actions = canManageWorkflow ? ACTIONS[status] || [] : [];
  const [selected, setSelected] = useState<Action | null>(null);
  const [comment, setComment] = useState("");
  const [fields, setFields] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  if (!actions.length) return null;
  const submit = async (action: Action) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action.id,
          comment,
          requestedFieldIds: fields
            .split(",")
            .map((field) => field.trim())
            .filter(Boolean),
          newDueAt: dueAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "无法更新工作流",
        );
      toast.success("工作流已更新");
      setSelected(null);
      setComment("");
      setFields("");
      setDueAt("");
      onChanged();
    } catch (error) {
      toast.error("未能更新工作流", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-950">
        <ShieldCheck className="size-4" />
        内部工作流操作
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={action.kind === "primary" ? "default" : "outline"}
            className={
              action.kind === "primary"
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-white"
            }
            onClick={() =>
              action.requiresComment ||
              action.requiresFields ||
              action.requiresDue
                ? setSelected(action)
                : void submit(action)
            }
            disabled={saving}
          >
            {action.id === "close_case" ? (
              <CheckCircle2 className="size-3.5" />
            ) : action.id === "reopen_case" ? (
              <RotateCcw className="size-3.5" />
            ) : (
              <Send className="size-3.5" />
            )}
            {action.label}
          </Button>
        ))}
      </div>
      {selected ? (
        <div className="mt-4 space-y-3 rounded-md border border-indigo-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-950">{selected.label}</p>
          {selected.requiresComment ? (
            <div className="space-y-1">
              <Label htmlFor="workflow-comment">操作意见 *</Label>
              <Textarea
                id="workflow-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
              />
            </div>
          ) : null}
          {selected.requiresFields ? (
            <div className="space-y-1">
              <Label htmlFor="workflow-fields">需要修改的字段 *</Label>
              <Input
                id="workflow-fields"
                value={fields}
                onChange={(event) => setFields(event.target.value)}
                placeholder="例如：root_cause, corrective_action"
              />
              <p className="text-xs text-slate-500">多个字段用逗号分隔。</p>
            </div>
          ) : null}
          {selected.requiresDue ? (
            <div className="space-y-1">
              <Label htmlFor="workflow-due">新的截止日期 *</Label>
              <Input
                id="workflow-due"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={
                saving ||
                (selected.requiresComment && !comment.trim()) ||
                (selected.requiresFields && !fields.trim()) ||
                (selected.requiresDue && !dueAt)
              }
              onClick={() => void submit(selected)}
            >
              {saving ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              确认操作
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
