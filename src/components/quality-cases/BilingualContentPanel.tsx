"use client";

import { useEffect, useState } from "react";
import { Languages, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = [
  { path: "complaint_summary", label: "客户投诉摘要", hint: "8D D2：问题描述" },
  { path: "containment", label: "临时围堵措施", hint: "8D D3：围堵说明" },
  { path: "root_cause", label: "已确认根因", hint: "8D D4：确认根因" },
  { path: "corrective_action", label: "纠正措施", hint: "8D D5：选定纠正措施" },
  { path: "implementation_plan", label: "实施计划", hint: "8D D6：实施计划" },
  { path: "effectiveness_verification", label: "有效性验证方法", hint: "8D D6：验证方法" },
  { path: "preventive_action", label: "防再发措施", hint: "8D D7：系统变更" },
  { path: "lessons_learned", label: "经验教训", hint: "8D D8：经验教训" },
] as const;

type FieldPath = (typeof FIELDS)[number]["path"];
type TextRecord = {
  original?: { text?: string };
  aiTranslation?: { text?: string };
  confirmedTranslation?: { text?: string };
};

export function BilingualContentPanel({
  caseId,
  initialOriginals = {},
}: {
  caseId: string;
  initialOriginals?: Partial<Record<FieldPath, string>>;
}) {
  const [fieldPath, setFieldPath] = useState<FieldPath>("complaint_summary");
  const [records, setRecords] = useState<Partial<Record<FieldPath, TextRecord>>>({});
  const [original, setOriginal] = useState(initialOriginals.complaint_summary || "");
  const [aiTranslation, setAiTranslation] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = FIELDS.find((field) => field.path === fieldPath)!;

  function applyField(path: FieldPath, nextRecords = records) {
    const record = nextRecords[path];
    setOriginal(record?.original?.text || initialOriginals[path] || "");
    setAiTranslation(record?.aiTranslation?.text || "");
    setConfirmed(record?.confirmedTranslation?.text || "");
  }

  useEffect(() => {
    fetch(`/api/quality-cases/${caseId}/texts`)
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        const nextRecords = rows.reduce(
          (result: Partial<Record<FieldPath, TextRecord>>, row: unknown) => {
            if (
              typeof row === "object" &&
              row !== null &&
              "fieldPath" in row &&
              typeof row.fieldPath === "string" &&
              FIELDS.some((field) => field.path === row.fieldPath)
            ) {
              result[row.fieldPath as FieldPath] = row as TextRecord;
            }
            return result;
          },
          {},
        );
        setRecords(nextRecords);
        applyField("complaint_summary", nextRecords);
      })
      .catch(() => {});
    // Fetching persisted text is intentionally one-time per Case mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const selectField = (nextPath: FieldPath) => {
    setFieldPath(nextPath);
    applyField(nextPath);
  };

  const save = async () => {
    if (!original.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}/texts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldPath,
          original: { language: "zh-CN", text: original },
          aiTranslation: aiTranslation
            ? { language: "en", text: aiTranslation }
            : null,
          confirmedTranslation: confirmed
            ? { language: "en", text: confirmed }
            : null,
        }),
      });
      const saved = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof saved.error === "string" ? saved.error : "无法保存双语内容",
        );
      setRecords((current) => ({ ...current, [fieldPath]: saved as TextRecord }));
      toast.success("双语内容已保存；AI 草稿不会进入最终输出。");
    } catch (error) {
      toast.error("保存失败", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
        <Languages className="size-4 text-indigo-600" />
        双语输出字段
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        原文、AI 草稿和人工确认英文分开保存。仅已确认英文可进入英文或中英双语 8D 输出；未确认字段会保留给编辑器人工补充。
      </p>
      <div className="mt-3 space-y-2">
        <Label htmlFor="bilingual-field">输出字段</Label>
        <select
          id="bilingual-field"
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900"
          value={fieldPath}
          disabled={loading}
          onChange={(event) => selectField(event.target.value as FieldPath)}
        >
          {FIELDS.map((field) => (
            <option key={field.path} value={field.path}>
              {field.label}（{field.hint}）
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 space-y-2">
        <Label htmlFor="original-text">{selected.label}原文（中文）</Label>
        <Textarea id="original-text" value={original} onChange={(event) => setOriginal(event.target.value)} rows={3} />
      </div>
      <div className="mt-3 space-y-2">
        <Label htmlFor="ai-translation">AI 翻译草稿（英文，可选）</Label>
        <Textarea id="ai-translation" value={aiTranslation} onChange={(event) => setAiTranslation(event.target.value)} rows={3} />
      </div>
      <div className="mt-3 space-y-2">
        <Label htmlFor="confirmed-translation">人工确认译文（英文）</Label>
        <Textarea id="confirmed-translation" value={confirmed} onChange={(event) => setConfirmed(event.target.value)} rows={3} />
      </div>
      <Button size="sm" className="mt-3 bg-indigo-600 text-white hover:bg-indigo-700" disabled={loading || !original.trim()} onClick={() => void save()}>
        {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        保存 {selected.label}
      </Button>
    </div>
  );
}
