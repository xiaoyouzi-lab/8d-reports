"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
};

const STAGES = [
  "发生了什么？",
  "先控制风险",
  "为什么可能发生？",
  "为什么没发现？",
  "怎样改进？",
  "怎样验证？",
];

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
    const response = await fetch(
      `/api/quality-case-tasks/${token}/guidance`,
      { cache: "no-store" },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || "任务链接不可用");
    else setData(result);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit() {
    if (!data?.question || !answer.trim()) return;
    setSaving(true);
    const response = await fetch(
      `/api/quality-case-tasks/${token}/guidance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: data.sessionId,
          questionId: data.question.id,
          answer,
        }),
      },
    );
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(result.error || "保存失败");
      return;
    }
    setAnswer("");
    setNotice(
      result.aiUnavailable
        ? "回答已保存。AI助手暂时不可用，系统会继续按下一项事实信息引导；不会把回答当作已确认结论。"
        : "已记录。AI助手正在引导下一步。",
    );
    await load();
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
            <p className="mt-2 text-sm text-slate-600">{error}</p>
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
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
              Q
            </span>
            质量整改助手
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpert(!expert)}
          >
            <FileText /> {expert ? "返回引导模式" : "切换专业模式"}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-7">
        <div className="mb-6 grid gap-3 rounded-2xl bg-indigo-700 p-5 text-white md:grid-cols-4">
          <div>
            <p className="text-xs text-indigo-200">质量整改请求</p>
            <p className="mt-1 font-semibold">{summary.title}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">问题摘要</p>
            <p className="mt-1 line-clamp-2 text-sm">
              {summary.complaintSummary}
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">回复截止</p>
            <p className="mt-1 text-sm">
              {new Intl.DateTimeFormat("zh-CN", {
                dateStyle: "medium",
              }).format(new Date(summary.dueAt))}
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">预计完成</p>
            <p className="mt-1 text-sm">约 15 分钟</p>
          </div>
        </div>

        {data.followUp ? (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold text-amber-950">
                <ClipboardList className="size-5" />
                内部审核需要你补充以下信息
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {data.followUp.reason}
              </p>
              <ol className="mt-3 space-y-2 pl-5 text-sm leading-6 text-amber-950">
                {data.followUp.questions.map((question, index) => (
                  <li key={`${index}-${question}`} className="list-decimal">
                    {question}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-amber-800">
                请继续按下方问题提供事实；不确定的信息可以明确写“需要核实”。
              </p>
            </CardContent>
          </Card>
        ) : null}

        {expert ? (
          <Card>
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold">专业答复模式</h1>
              <p className="mt-2 text-sm text-slate-600">
                可直接整理调查结论；这不会删除已保存的引导回答。
              </p>
              <Textarea
                className="mt-5"
                rows={10}
                placeholder="请基于事实填写调查、临时控制、原因、措施和验证计划…"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)_15rem]">
            <aside>
              <p className="text-sm font-medium">调查进度</p>
              {STAGES.map((item, index) => (
                <div
                  key={item}
                  className={`mt-3 flex gap-2 text-sm ${index < data.progress.answered ? "text-emerald-700" : "text-slate-500"}`}
                >
                  <CheckCircle2 className="size-4" />
                  {item}
                </div>
              ))}
            </aside>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Bot className="size-5" />
                  <span className="text-sm font-medium">AI 质量工程师</span>
                </div>
                <h1 className="mt-4 text-2xl font-semibold">
                  {data.question?.userFacingQuestion ||
                    "调查已完成，请等待内部审核。"}
                </h1>
                {data.question?.explanation ? (
                  <p className="mt-3 border-l-2 border-indigo-200 pl-3 text-sm leading-6 text-slate-600">
                    为什么需要这个信息：{data.question.explanation}
                  </p>
                ) : null}
                <Textarea
                  className="mt-6"
                  rows={7}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="请用自己的话说明实际情况；不确定的信息可以写“需要核实”。"
                />
                <p className="mt-2 text-xs text-slate-500">
                  示例：说明发生位置、时间、范围或现有记录。请勿猜测根因、数量或测试结果。
                </p>
                {notice ? (
                  <p className="mt-3 text-sm text-amber-700">{notice}</p>
                ) : null}
                <div className="mt-5 flex justify-end">
                  <Button
                    disabled={saving || !data.question || !answer.trim()}
                    onClick={() => void submit()}
                  >
                    {saving ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <ChevronRight />
                    )}
                    继续回答
                  </Button>
                </div>
              </CardContent>
            </Card>
            <aside>
              <Card>
                <CardContent className="p-5">
                  <div className="flex gap-2 font-medium">
                    <LockKeyhole className="size-4 text-indigo-600" />
                    你的整改摘要
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    已完成 {data.progress.answered}/{data.progress.total} 个阶段。
                  </p>
                  <div className="mt-4 border-t pt-4 text-xs leading-5 text-slate-500">
                    内部备注、商务信息和其他供应商数据不会显示。
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
