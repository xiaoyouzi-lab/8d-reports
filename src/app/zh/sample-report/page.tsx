import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileArchive, FileText, ImageIcon, ShieldCheck } from "lucide-react";
import { PrimaryCTA, TrackedLink } from "@/components/marketing/MarketingActions";
import { StepAccordion } from "@/components/marketing/FaqAccordion";
import {
  Breadcrumbs,
  JsonLd,
  PageHero,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { buttonVariants } from "@/components/ui/button";
import { socialOpenGraphImage } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "完整 8D 报告示例",
  description:
    "查看一份从围堵到验证纠正措施的完整 8D 示例，包含证据、导出包和相关行业示例。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/sample-report",
    languages: {
      en: "https://www.8d-reports.com/sample-report",
      "zh-CN": "https://www.8d-reports.com/zh/sample-report",
    },
  },
  openGraph: {
    title: "完整 8D 报告示例",
    description:
      "在创建自己的客户可交付 8D 回复之前，先查看一份完成的 D0-D8 报告示例。",
    url: "https://www.8d-reports.com/zh/sample-report",
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: "https://www.8d-reports.com/zh" },
  { label: "报告示例", href: "https://www.8d-reports.com/zh/sample-report" },
];

const sampleReportSteps = [
  {
    id: "D0",
    title: "准备回复",
    body: "客户就制动支架涂层剥落提出投诉。质量工程师在启动 8D 前确认了范围、紧急程度、首次回复日期和报告负责人。",
    details: "范围：批次 B26-041，客户产线验证，高优先级。",
  },
  {
    id: "D1",
    title: "组建团队",
    body: "质量工程、涂装工艺负责人、生产主管、仓库和供应商质量共同参与调查，并明确证据、围堵和客户回复的负责人。",
    details: "负责人：质量工程。参与方：工艺、生产、仓库、SQE。",
  },
  {
    id: "D2",
    title: "描述问题",
    body: "500 个制动支架中有 18 个在盐雾验证后出现可见涂层剥落。问题仅限 2 号涂装线、B 班、生产日期 2026-05-18、批次 B26-041。",
    details: "优秀的报告从可测量的事实开始。",
  },
  {
    id: "D3",
    title: "围堵问题",
    body: "隔离受影响库存，启动 100% 外观检查，通知客户服务，并在根因验证前对所有未发货订单增加临时出货检验。",
    details: "围堵在调查继续期间保护客户。",
  },
  {
    id: "D4",
    title: "验证根本原因",
    body: "发生原因：换线前跳过了治具清洁检查。流出原因：出货检验清单未包含涂层边缘附着力检查。",
    details: "可信的 8D 报告会区分发生原因和流出原因。",
  },
  {
    id: "D5",
    title: "选择纠正措施",
    body: "团队增加治具清洁强制签核，更新涂装设置检查清单，并在复产前重新培训 B 班操作员。",
    details: "措施必须能追溯到已验证的原因。",
  },
  {
    id: "D6",
    title: "实施并验证",
    body: "后续三个批次均通过附着力和外观检查。发货 1,500 件后未再发现重复缺陷。",
    details: "验证要包含结果和样本量，而不只是完成日期。",
  },
  {
    id: "D7",
    title: "预防再发",
    body: "更新控制计划、分层审核清单和类似产线启动检查清单，并为后续涂装工作加入换线经验。",
    details: "预防把一次修复变成可复用的质量控制。",
  },
  {
    id: "D8",
    title: "关闭并认可团队",
    body: "客户接受了纠正措施包。关闭前记录了最终经验教训和团队认可。",
    details: "关闭记录客户接受，并为未来报告保留经验。",
  },
];

const evidenceItems = [
  {
    icon: ImageIcon,
    title: "照片与检验记录",
    text: "证据与所支持的步骤绑定，让评审人能看到决策依据。",
  },
  {
    icon: FileText,
    title: "PDF、Word 与 Excel 输出",
    text: "正式交付可以匹配收件方格式，而无需重写报告。",
  },
  {
    icon: FileArchive,
    title: "附件打包",
    text: "当报告存在附件时，所选报告格式与附件文件会一起下载为 ZIP 包。",
  },
];

const credibilityChecks = [
  "D2 包含数量、日期、产品、客户背景和受影响范围。",
  "D3 围堵与永久纠正措施相互独立。",
  "D4 区分发生原因与流出原因。",
  "D5 措施可追溯到已验证的原因。",
  "D6 包含有效性证据和样本量。",
];

const relatedExamples = [
  { label: "汽车行业 8D 示例", href: "/8d-report-example/automotive" },
  { label: "供应商质量 8D 示例", href: "/8d-report-example/supplier-quality" },
  { label: "客户投诉 8D 示例", href: "/8d-report-example/customer-complaint" },
];

export default function ChineseSampleReportPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <PageHero
        title="一份完整的 8D 示例 —— 从围堵到验证纠正措施。"
        description="用这份示例了解一份完成的报告如何把客户问题、证据、D0-D8 推理、评审状态和导出包串联起来。"
        actions={
          <>
            <PrimaryCTA href="/zh/signup" page="sample_report" location="zh_hero">
              免费创建一份 8D 报告
            </PrimaryCTA>
            <TrackedLink
              href="/api/sample-reports/automotive"
              rel="nofollow"
              eventName="sample_download"
              eventData={{ page: "sample_report", format: "pdf" }}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50",
              )}
            >
              下载示例 PDF
              <Download className="h-4 w-4" />
            </TrackedLink>
            <PrimaryCTA
              href="/zh/resources"
              page="sample_report"
              location="zh_hero"
              variant="ghost"
            >
              浏览行业示例
            </PrimaryCTA>
          </>
        }
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="font-mono text-sm font-semibold text-indigo-600">
                  2026-05-18-001
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  制动支架涂层失效
                </h2>
              </div>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                已完成
              </span>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["客户", "Northline Motors"],
                ["受影响范围", "18 / 500 件"],
                ["负责人", "质量工程"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              这份报告展示了一次受控响应：即时围堵、经确认的治具清洁原因、清单更新、再培训，以及三个合格批次。
            </p>
          </div>
        </div>
      </PageHero>

      <Section>
        <SectionHeader
          title="浏览 D0-D8 报告"
          description="展开每个步骤，查看已完成报告背后的证据、推理、措施和验证。"
        />
        <div className="mt-8">
          <StepAccordion
            items={sampleReportSteps}
            defaultOpen={["D2", "D4", "D5"]}
            page="sample_report"
          />
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="证据与导出包"
          description="一份完整的回复不只是 D0-D8 文字。最终交付件应携带客户评审所需的证据。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {evidenceItems.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="这份报告为什么可信"
            description="一份客户可交付的 8D 报告会说明事实、原因、措施和验证如何相互支撑。"
          />
          <ul className="space-y-3">
            {credibilityChecks.map((check) => (
              <li key={check} className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm leading-6 text-slate-700">{check}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            title="相关行业示例"
            description="当问题类型或客户背景更接近你的报告时，可以参考这些示例。"
          />
          <Link
            href="/zh/resources"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
          >
            浏览全部资源
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {relatedExamples.map((example) => (
            <Link
              key={example.href}
              href={example.href}
              className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                完整示例
              </p>
              <h3 className="mt-3 text-base font-semibold text-slate-950">
                {example.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                查看相关质量场景下的实用 D0-D8 回复。
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-950 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              准备好整理你自己的 8D 回复了吗？
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              从同样的 D0-D8 工作流开始，在报告准备好交付客户时导出。
            </p>
          </div>
          <PrimaryCTA
            href="/zh/signup"
            page="sample_report"
            location="zh_final_cta"
            className="bg-white text-slate-950 hover:bg-slate-100"
          >
            免费开始，含 3 份报告
          </PrimaryCTA>
        </div>
      </Section>
    </PageShell>
  );
}
