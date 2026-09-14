import type { Metadata } from "next"
import { Archive, ArrowRight, Download, FileSpreadsheet, FileText, LockKeyhole } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { TrackedLink } from "@/components/marketing/MarketingActions"
import { DEMO_REPORTS_ZH } from "@/lib/demo-reports-zh"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "8D 工作流演示 | 汽车、注塑成型与电子",
  description:
    "查看三个完整的制造 8D 场景，展示证据、根本原因分析、审批、报告锁定、修订版本和客户可用交付。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/demo-reports",
    languages: {
      en: "https://www.8d-reports.com/demo-reports",
      "zh-CN": "https://www.8d-reports.com/zh/demo-reports",
    },
  },
}

const demos = Object.values(DEMO_REPORTS_ZH)

export default function ChineseDemoReportsPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">团队工作流演示</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">了解质量团队如何控制一份客户可用的 8D 报告。</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">每个场景都展示报告内容及其治理：角色、审批、锁定、修订版本、活动日志和正式交付。</p>
        </div>
      </section>
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-3">
          {demos.map((demo) => (
            <article key={demo.slug} className="flex flex-col rounded-xl border border-slate-200 p-6">
              <LockKeyhole className="size-5 text-indigo-600" />
              <h2 className="mt-5 text-xl font-semibold">{demo.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{demo.scenario}</p>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{demo.highlights}</p>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <TrackedLink href={`/zh/demo-reports/${demo.slug}`} eventName="marketing_cta_clicked" eventData={{ page: "demo_reports", location: "demo_card", demoType: demo.slug }} className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}>查看完整示例 <ArrowRight className="size-4" /></TrackedLink>
                <TrackedLink href={`/api/sample-reports/${demo.slug}`} eventName="demo_report_downloaded" eventData={{ demoType: demo.slug, format: "pdf" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Download className="size-4" /> 下载 PDF</TrackedLink>
                <TrackedLink href={`/api/sample-reports/${demo.slug}?format=docx`} eventName="demo_report_downloaded" eventData={{ demoType: demo.slug, format: "docx" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><FileText className="size-4" /> 下载 Word</TrackedLink>
                <TrackedLink href={`/api/sample-reports/${demo.slug}?format=xlsx`} eventName="demo_report_downloaded" eventData={{ demoType: demo.slug, format: "xlsx" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><FileSpreadsheet className="size-4" /> 下载 Excel</TrackedLink>
                <TrackedLink href={`/api/sample-reports/${demo.slug}?format=zip`} eventName="demo_report_downloaded" eventData={{ demoType: demo.slug, format: "zip" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Archive className="size-4" /> 下载交付 ZIP</TrackedLink>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
