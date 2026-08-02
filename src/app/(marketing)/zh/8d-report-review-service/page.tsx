import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ShieldCheck } from "lucide-react"
import { RejectCheckIntake } from "@/components/rejection-review/RejectCheckIntake"

export const metadata: Metadata = {
  title: "8D 客户退回风险检查 | 提交前找出薄弱点",
  description: "在提交 8D、SCAR 或客户整改回复前，检查拒绝风险、逻辑断点、薄弱措施与证据缺口。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/8d-report-review-service",
    languages: {
      en: "https://www.8d-reports.com/8d-report-review-service",
      "zh-CN": "https://www.8d-reports.com/zh/8d-report-review-service",
    },
  },
}

const checks = [
  "问题描述是否具体、可测量且便于客户理解",
  "临时遏制是否说明范围、责任人和验证结果",
  "发生原因和流出原因是否真正分开",
  "根因是否只停留在员工疏忽或直接原因",
  "纠正措施是否真正对应根因，而不只是培训或全检",
  "效果验证是否包含样本、时间、标准和客观结果",
  "防止再发是否覆盖相似产品、产线与系统文件",
]

export default function ChineseReportReviewServicePage() {
  return (
    <div className="bg-white font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-indigo-600">8D Reject Check</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              在客户退回你的 8D 之前，找出它为什么站不住。
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              粘贴或上传计划在未来 24—72 小时内提交的 8D、SCAR 或整改回复。免费结果先告诉你当前是否适合提交，以及最严重的三项客户退回风险。
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-700">
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> 免费结果先执行自动检查，付费结果交付前由内部人员复核</div>
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> 每项问题必须指向原文或明确的缺失事实</div>
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600" /> 不编造日期、数量、证据、批准、根因或验证结果</div>
            </div>
          </div>
          <RejectCheckIntake locale="zh-CN" />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">24 小时深度审查会逐项挑战什么</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
            <span className="font-semibold text-slate-950">24-hour Deep Review：每份 99 美元。</span>{" "}
            一次性购买。自动初检结果会在交付前由内部人员复核，包含逐项分析、应补事实、客户可能追问、基于已知事实的英文改写和可下载 DOCX 审查包。不承诺客户必然接受、合规通过、根因已确认或措施已证明有效。
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/8d-report-review-service" className="font-medium text-indigo-600 hover:text-indigo-700">View the English page</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
