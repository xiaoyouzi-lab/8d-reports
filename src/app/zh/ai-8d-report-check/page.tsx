import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI 8D 报告检查",
  description:
    "对 8D 报告运行自动化的 AI 质量检查，在提交客户前发现缺失证据、薄弱的根因逻辑和不清晰的验证。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/ai-8d-report-check",
    languages: {
      en: "https://www.8d-reports.com/ai-8d-report-check",
      "zh-CN": "https://www.8d-reports.com/zh/ai-8d-report-check",
    },
  },
};

const checks = [
  "问题描述可测量且范围清晰",
  "围堵与永久纠正措施相互独立",
  "根因区分发生原因与流出原因",
  "纠正措施可追溯到已验证的根本原因",
  "验证包含方法、样本和结果",
  "预防更新的是体系，而不只是零件",
  "缺失证据会被标记，而不是被编造",
];

export default function ChineseAi8dReportCheckPage() {
  return (
    <div className="bg-white font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              AI 8D 报告检查
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              在客户之前，先检查你的 8D 报告。
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              AI 质量检查会对已保存的报告进行自动化的应用内评审。它会查找缺失证据、薄弱的根因逻辑、不清晰的纠正措施和不足的验证，并列出需要补齐的缺口。它不会批准报告，也不会替代你的质量负责人。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/zh/signup"
                className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 hover:bg-indigo-700")}
              >
                免费创建报告
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/zh/sample-report" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                查看报告示例
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileSearch className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">随编辑器提供</p>
                <p className="text-xl font-semibold text-slate-950">自动化缺口评审</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> 基于已保存的报告内容运行
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> 标记缺口，但不编造证据
              </div>
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" /> 审批仍由你的质量负责人负责
              </div>
            </div>
            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              AI 发现只是评审提示，不会批准、认证或替代工程判断。
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            自动化检查会关注什么
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
