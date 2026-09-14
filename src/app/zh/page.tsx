import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileArchive,
  FileSpreadsheet,
  MessageSquareWarning,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PrimaryCTA } from "@/components/marketing/MarketingActions";
import {
  JsonLd,
  PageHero,
  PageShell,
  Section,
  SectionHeader,
} from "@/components/marketing/MarketingPrimitives";
import { socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "在线 8D 报告编辑与导出工具",
  description:
    "在线完成结构化的 D0-D8 8D 报告：证据与附件、分享链接、PDF / Word / Excel 导出（含附件时打包为 ZIP）、Team 审批与锁定、知识库复用，以及自动化的 AI 质量检查。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh",
    languages: {
      en: "https://www.8d-reports.com",
      "zh-CN": "https://www.8d-reports.com/zh",
    },
  },
  openGraph: {
    title: "在线 8D 报告编辑与导出工具",
    description:
      "面向质量工程师、SQE 与小型制造质量团队的 8D 报告响应与交付工作台。",
    url: "https://www.8d-reports.com/zh",
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "8D Reports",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://www.8d-reports.com/zh",
  description:
    "用于在线编辑、评审和导出的 D0-D8 8D 报告工作台，支持证据附件、分享、Team 协作、知识库复用与 AI 质量检查。",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "免费方案包含 3 份终身报告。",
  },
};

const facts = [
  "完整 D0-D8 工作流",
  "证据与附件",
  "PDF / Word / Excel 导出",
  "Team 审批、修订与活动记录",
];

const workflow = [
  {
    icon: MessageSquareWarning,
    title: "记录问题",
    text: "从客户投诉、供应商问题或重复缺陷开始，建立一份结构化报告。",
  },
  {
    icon: ShieldCheck,
    title: "调查原因",
    text: "按 D0-D8 填写围堵、根因、纠正措施与预防，并把证据放在对应步骤。",
  },
  {
    icon: RefreshCw,
    title: "评审变更",
    text: "通过分享、审批、锁定、修订和活动记录控制每一次修改。",
  },
  {
    icon: PackageCheck,
    title: "交付文件",
    text: "导出 PDF、Word 或 Excel；存在附件时，与所选格式一起打包为 ZIP 下载。",
  },
];

const useCases = [
  "客户投诉 8D 报告",
  "供应商纠正措施 / SCAR 报告",
  "内部重复缺陷 8D 报告",
];

const plans = [
  {
    name: "Free",
    text: "3 份终身报告、D0-D8 编辑器、附件、仅查看分享，以及带水印 PDF。",
  },
  {
    name: "Pro",
    text: "个人无限报告、无水印 PDF、Word 与 Excel 导出、公司 Logo、可编辑分享，以及深度历史检索。",
  },
  {
    name: "Team",
    text: "Team 面向受控的评审、审批与交付：5 个席位、共享工作区、角色、锁定、修订与活动记录。",
  },
];

const homeFaqs = [
  {
    question: "需要信用卡才能开始吗？",
    answer: "不需要。免费方案包含 3 份终身报告，无需填写信用卡。",
  },
  {
    question: "可以导出 Word 和 Excel 吗？",
    answer:
      "可以。Pro、Team 与单份报告导出可解锁无水印 PDF、Word 和 Excel。",
  },
  {
    question: "供应商或客户可以查看报告吗？",
    answer:
      "可以。免费方案支持仅查看分享；需要协作时，Pro 和 Team 可以使用可编辑分享。",
  },
  {
    question: "AI 会自动批准报告吗？",
    answer:
      "不会。AI 质量检查是测试版助手，只提示可能存在的缺口，最终审批仍由人工负责。",
  },
];

function HeroProductPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="font-mono text-xs font-semibold text-indigo-600">
              8D-2026-014
            </p>
            <p className="text-sm font-semibold text-slate-950">
              制动支架涂层失效
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            评审中
          </span>
        </div>
        <div className="grid min-h-[430px] grid-cols-[76px_1fr] sm:grid-cols-[108px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50 p-3">
            {["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"].map((step) => (
              <div
                key={step}
                className={
                  step === "D4"
                    ? "mb-1.5 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white"
                    : "mb-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500"
                }
              >
                {step}
              </div>
            ))}
          </aside>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              D4 根本原因
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              为什么会发生，又为什么会流出？
            </h2>
            <div className="mt-5 space-y-3">
              {[
                ["发生原因", "换线前跳过了治具清洁检查。"],
                ["流出原因", "出货检验未检查涂层边缘附着力。"],
                ["证据", "盐雾照片、涂层记录、换线记录。"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["PDF", "Word", "Excel"].map((format) => (
                <div
                  key={format}
                  className="rounded-md bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700"
                >
                  {format}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChineseLandingPage() {
  return (
    <PageShell>
      <JsonLd data={productJsonLd} />
      <PageHero
        title="在线完成可直接交付客户的 8D 报告，无需再用 Excel 重做。"
        description="记录问题、收集证据、按 D0-D8 推进、评审变更，并导出 PDF、Word 或 Excel；存在附件时，与所选格式一起打包为 ZIP 下载。"
        actions={
          <>
            <PrimaryCTA href="/zh/signup" page="home" location="zh_hero">
              免费开始，含 3 份报告
            </PrimaryCTA>
            <PrimaryCTA
              href="/zh/sample-report"
              page="home"
              location="zh_hero"
              variant="secondary"
            >
              查看完整 8D 示例
            </PrimaryCTA>
          </>
        }
      >
        <HeroProductPreview />
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact} className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Check className="h-4 w-4 text-emerald-600" />
              {fact}
            </div>
          ))}
        </div>
      </PageHero>

      <Section id="workflow">
        <SectionHeader
          title="从问题记录到可交付文件"
          description="沿着质量团队熟悉的路径推进，并让最终交付件始终与源报告保持关联。"
        />
        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {workflow.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeader
            title="一份报告，而不是五个互不相干的文件"
            description="Excel、Word、邮件、照片和 ZIP 文件夹很容易彼此脱节。8D Reports 把调查、证据、评审状态、导出和复用历史放在一起。"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <FileSpreadsheet className="h-5 w-5 text-slate-500" />
              <h3 className="mt-4 font-semibold text-slate-950">表格混乱</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                多个副本、附件分散、评审状态不清，交付前还要手动重排格式。
              </p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-white p-5">
              <FileArchive className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 font-semibold text-slate-950">受控工作区</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                结构化 D0-D8 字段、按步骤上传附件、分享、导出，以及可检索的报告历史。
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          title="为真实的质量工作而设计"
          description="当一份质量回复需要足够完整以便评审、又足够简单以便无需重做文档就能完成时，就可以使用它。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {useCases.map((useCase) => (
            <article key={useCase} className="rounded-lg border border-slate-200 p-5">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {useCase}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                记录问题、控制风险、验证原因、分配措施，并保留最终回复以便复用。
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="border-b border-slate-200 pb-4">
              <p className="font-mono text-sm font-semibold text-indigo-600">
                8D 报告示例
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                制动支架涂层失效
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p>D2：500 个制动支架中有 18 个在盐雾验证后出现涂层剥落。</p>
              <p>D4：换线前跳过了治具清洁检查；流出控制未覆盖涂层边缘附着力。</p>
              <p>D6：后续三个批次均通过附着力和外观检查。</p>
            </div>
          </div>
          <div>
            <SectionHeader
              title="查看一份完成的报告"
              description="在创建自己的报告之前，先了解一份完整 8D 回复的结构。"
            />
            <div className="mt-6">
              <PrimaryCTA
                href="/zh/sample-report"
                page="home"
                location="zh_sample_section"
                variant="secondary"
              >
                查看完整示例
              </PrimaryCTA>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            title="可用于评估、日常交付与团队控制"
            description="免费开始，只在需要正式交付或共享工作流控制时升级。"
          />
          <Link
            href="/zh/pricing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
          >
            对比定价
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-lg border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-950">{plan.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{plan.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              用一份可直接交付客户的报告开始。
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              免费方案包含 3 份终身报告，第一次有价值的测试可以是一份真实回复，而不是空白模板。
            </p>
            <div className="mt-7">
              <PrimaryCTA
                href="/zh/signup"
                page="home"
                location="zh_final_cta"
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                免费开始，含 3 份报告
              </PrimaryCTA>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <h3 className="text-base font-semibold text-white">常见问题</h3>
            <div className="mt-4 space-y-4">
              {homeFaqs.map((faq) => (
                <div key={faq.question}>
                  <p className="text-sm font-semibold text-white">{faq.question}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
