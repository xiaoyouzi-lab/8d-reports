import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, FileText, History, LockKeyhole } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TrackedLink } from "@/components/marketing/MarketingActions";
import { DEMO_REPORTS } from "@/lib/demo-reports";
import { DEMO_REPORTS_ZH, getDemoReportZh } from "@/lib/demo-reports-zh";
import { cn } from "@/lib/utils";

export const dynamicParams = false;

const baseUrl = "https://www.8d-reports.com";

export function generateStaticParams() {
  return Object.keys(DEMO_REPORTS_ZH).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const demo = getDemoReportZh(type);
  if (!demo) return {};
  const zhUrl = `${baseUrl}/zh/demo-reports/${type}`;
  const enUrl = `${baseUrl}/demo-reports/${type}`;
  return {
    title: `${demo.title} | 受控 8D 工作流演示`,
    description: `查看该${demo.industry}场景的完整 D0-D8 内容、证据、审批、锁定、修订历史和交付包。`,
    alternates: {
      canonical: zhUrl,
      languages: { en: enUrl, "zh-CN": zhUrl },
    },
    openGraph: {
      title: demo.title,
      description: `查看该${demo.industry}场景的完整 D0-D8 内容、证据、审批、锁定、修订历史和交付包。`,
      url: zhUrl,
      type: "article",
      locale: "zh_CN",
    },
  };
}

export default async function ChineseDemoReportPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const demo = getDemoReportZh(type);
  if (!demo) notFound();

  const data = demo.reportData;
  const evidence = DEMO_REPORTS[type]?.evidenceFiles ?? [];
  const images = evidence.filter((file) => file.publicPath);
  const textEvidence = evidence.filter((file) => !file.publicPath);

  const reportSections = [
    ["D1 团队", `${data.teamLeader}；${data.teamMembers}`],
    ["D2 问题描述", data.problemDescription],
    ["D3 围堵", `${data.containmentDescription}\n\n验证：${data.containmentVerification}`],
    ["D4 根本原因", `发生原因：${data.rootCauseOccurrence}\n\n流出原因：${data.rootCauseEscape}\n\n体系原因：${data.rootCauseSystem}\n\n已确认：${data.confirmedRootCause}`],
    ["D5 纠正措施", `${data.selectedCorrectiveAction}\n\n理由：${data.correctiveRationale}`],
    ["D6 实施与验证", `${data.implementationPlan}\n\n方法：${data.validationMethod}\n\n结果：${data.validationResults}`],
    ["D7 预防", `${data.systemChanges}\n\n${data.horizontalDeployment}`],
    ["D8 关闭与审批", `${data.lessonsLearned}\n\n编制：${data.preparedBy} · 评审：${data.reviewedBy} · 审批：${data.approverName}`],
  ] as const;

  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/zh/demo-reports" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="size-4" /> 所有工作流演示
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">{demo.industry} · {demo.revision}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{demo.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{demo.workflowSummary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <TrackedLink href={`/api/sample-reports/${type}`} eventName="demo_report_downloaded" eventData={{ demoType: type, format: "pdf" }} rel="nofollow" className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}><Download className="size-4" /> PDF</TrackedLink>
                <TrackedLink href={`/api/sample-reports/${type}?format=docx`} eventName="demo_report_downloaded" eventData={{ demoType: type, format: "docx" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><FileText className="size-4" /> Word</TrackedLink>
                <TrackedLink href={`/api/sample-reports/${type}?format=xlsx`} eventName="demo_report_downloaded" eventData={{ demoType: type, format: "xlsx" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><FileSpreadsheet className="size-4" /> Excel</TrackedLink>
                <TrackedLink href={`/api/sample-reports/${type}?format=zip`} eventName="demo_report_downloaded" eventData={{ demoType: type, format: "zip" }} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Archive className="size-4" /> 交付 ZIP</TrackedLink>
              </div>
            </div>
            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-6 text-sm">
              {[
                ["报告", data.reportNumber],
                ["客户", data.customerName],
                ["产品", data.productName],
                ["批次", data.batchNumber],
                ["优先级", data.priority],
                ["审批", `${data.preparedBy} / ${data.reviewedBy} / ${data.approverName}`],
              ].map(([label, value]) => <div key={label} className="grid grid-cols-[90px_1fr] gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="font-medium text-slate-500">{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.62fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold tracking-tight">完整 D0-D8 报告内容</h2>
            {reportSections.map(([title, value]) => (
              <article key={title} className="border-b border-slate-200 py-5">
                <h3 className="text-lg font-semibold text-indigo-700">{title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{value}</p>
              </article>
            ))}
          </div>
          <aside className="space-y-8">
            <div>
              <div className="flex items-center gap-2"><History className="size-5 text-indigo-600" /><h2 className="text-xl font-semibold">工作流活动</h2></div>
              <ol className="mt-5 space-y-3">
                {demo.workflow.map((item) => <li key={item.title} className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 text-emerald-600" />{item.title}</div><p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p></li>)}
              </ol>
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-950 p-4 text-xs leading-5 text-white"><LockKeyhole className="size-4 shrink-0 text-indigo-300" />已审批、已提交和已关闭的报告会被锁定。只有 Owner 可以带原因解锁以进行修订。</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">证据包</h2>
              <div className="mt-4 space-y-4">
                {images.map((file) => (
                  <figure key={file.filename} className="overflow-hidden rounded-lg border border-slate-200">
                    <Image src={file.publicPath!} alt={`${demo.title} 证据：${file.filename}`} width={1200} height={900} className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="p-3 text-xs text-slate-600">{file.stepId}：{file.filename}</figcaption>
                  </figure>
                ))}
                <ul className="space-y-2 text-xs text-slate-600">
                  {textEvidence.map((file) => <li key={file.filename} className="rounded-md bg-slate-50 p-3">{file.stepId}：{file.filename}</li>)}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">准备好创建自己的 8D 报告了吗？</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">免费开始，使用完整的 D0-D8 编辑器、附件、分享和带水印 PDF 导出。</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}>免费创建 8D 报告</Link>
            <Link href="/zh/8d-report-template" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white")}>查看 8D 模板</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
