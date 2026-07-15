"use client";

import { useState } from "react";
import { ArrowRight, FileOutput, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const OUTPUT_LABELS: Record<string, string> = {
  scar: "SCAR",
  car: "CAR",
  capa: "CAPA",
  ncr_response: "NCR 回复",
  corrective_action_report: "纠正措施报告",
};

export function OutputComposer({
  caseId,
  outputType,
}: {
  caseId: string;
  outputType: string;
}) {
  const [creating, setCreating] = useState(false);
  const [languageMode, setLanguageMode] = useState<"en" | "bilingual">("en");
  const createEightD = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}/outputs/8d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageMode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "无法创建 8D 输出",
        );
      window.location.assign(`/reports/${data.report.id}`);
    } catch (error) {
      toast.error("未能创建 8D 输出", {
        description: error instanceof Error ? error.message : undefined,
      });
      setCreating(false);
    }
  };
  const createDocument = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}/outputs/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageMode }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "无法创建质量案例文档",
        );
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${outputType}_response.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("质量案例文档已生成，已保留导出审计记录。");
    } catch (error) {
      toast.error("未能创建质量案例文档", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  };
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {outputType !== "8d" ? (
        <>
          <p className="text-xs leading-5 text-slate-600">
            此 Case 指定为 {OUTPUT_LABELS[outputType] || outputType}。
            系统会生成与该类型匹配的 Quality Case 文档，而不会错误地转换为 8D 报告。
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            文档默认不包含内部证据，仅使用人工确认内容；需要 Pro 或 Team 才可下载 Word 输出。
          </p>
          <label className="mt-3 block text-xs font-medium text-slate-700" htmlFor="document-language-mode">
            输出语言
          </label>
          <select
            id="document-language-mode"
            value={languageMode}
            onChange={(event) => setLanguageMode(event.target.value as "en" | "bilingual")}
            className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900"
            disabled={creating}
          >
            <option value="en">English</option>
            <option value="bilingual">中文 + English</option>
          </select>
          <Button
            size="sm"
            className="mt-3 bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={creating}
            onClick={() => void createDocument()}
          >
            {creating ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileOutput className="size-3.5" />}
            生成 {OUTPUT_LABELS[outputType] || outputType} Word 文档
            <ArrowRight className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
      <p className="text-xs leading-5 text-slate-600">
        创建后将进入原有 8D 编辑器。英文或中英双语输出仅使用人工确认的英文投诉摘要；AI 草稿绝不会导出。
      </p>
      <label className="mt-3 block text-xs font-medium text-slate-700" htmlFor="output-language-mode">
        输出语言
      </label>
      <select
        id="output-language-mode"
        value={languageMode}
        onChange={(event) => setLanguageMode(event.target.value as "en" | "bilingual")}
        className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900"
        disabled={creating}
      >
        <option value="en">English</option>
        <option value="bilingual">中文 + English</option>
      </select>
      <Button
        size="sm"
        className="mt-3 bg-indigo-600 text-white hover:bg-indigo-700"
        disabled={creating}
        onClick={() => void createEightD()}
      >
        {creating ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <FileOutput className="size-3.5" />
        )}
        {creating
          ? "正在创建"
          : languageMode === "en"
            ? "创建英文 8D 输出"
            : "创建中英双语 8D 输出"}
        <ArrowRight className="size-3.5" />
      </Button>
        </>
      )}
    </div>
  );
}
