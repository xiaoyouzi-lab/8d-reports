"use client";

import { useState } from "react";
import { LoaderCircle, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Assignee = { userId: string; displayName: string };

export function AssigneeSelector({
  caseId,
  currentAssignee,
  assignees,
  canAssign,
  onChanged,
}: {
  caseId: string;
  currentAssignee: Assignee | null;
  assignees: Assignee[];
  canAssign: boolean;
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState(currentAssignee?.userId || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!selected || selected === currentAssignee?.userId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeUserId: selected }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "无法更新负责人",
        );
      toast.success("负责人已更新，已记录新的版本和审计事件。");
      onChanged();
    } catch (error) {
      toast.error("未能更新负责人", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
        <UserRoundCheck className="size-4 text-indigo-600" />
        负责人
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {currentAssignee?.displayName || "未分配"}
      </p>
      {canAssign && assignees.length > 0 ? (
        <div className="mt-3 flex gap-2">
          <select
            aria-label="选择负责人"
            className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900"
            value={selected}
            disabled={saving}
            onChange={(event) => setSelected(event.target.value)}
          >
            {assignees.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={saving || !selected || selected === currentAssignee?.userId}
            onClick={() => void save()}
          >
            {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
            保存
          </Button>
        </div>
      ) : null}
    </div>
  );
}
