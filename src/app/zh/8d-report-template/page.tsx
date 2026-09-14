import type { Metadata } from "next"
import {
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FileType,
} from "lucide-react"
import { CopyTemplateButton, PrimaryCTA } from "@/components/marketing/MarketingActions"
import { FaqAccordion, StepAccordion } from "@/components/marketing/FaqAccordion"
import {
  Breadcrumbs,
  JsonLd,
  PageHero,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { socialOpenGraphImage, siteUrl, type SimpleFaq } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "8D 报告模板 | D0-D8 在线表单与可复制模板",
  description:
    "使用以行动为先的 8D 报告模板，包含可复制的空白结构、D0-D8 指引、常见错误、Word/Excel/PDF 对比以及 FAQ。",
  alternates: {
    canonical: `${siteUrl}/zh/8d-report-template`,
    languages: {
      en: `${siteUrl}/8d-report-template`,
      "zh-CN": `${siteUrl}/zh/8d-report-template`,
    },
  },
  openGraph: {
    title: "8D 报告模板",
    description:
      "面向需要客户可用 8D 报告、又不想在 Excel 中反复重建的质量工程师的实用 D0-D8 模板。",
    url: `${siteUrl}/zh/8d-report-template`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "首页", href: siteUrl },
  { label: "8D 模板", href: `${siteUrl}/zh/8d-report-template` },
]

const commonMistakes = [
  "把 D2 写成宽泛的症状，缺少数量、地点、时间或规格证据。",
  "把分选或返工当作永久纠正措施，而不是临时围堵。",
  "5Why 停在操作员动作，而未验证流程或体系原因。",
  "列出无法追溯到经验证的发生原因和流出原因的 D5 措施。",
  "在没有有效性检查、样本量、结果或监控周期的情况下关闭 D6。",
]

const formatGuidance = [
  {
    icon: FileText,
    format: "PDF",
    bestFor: "固定的客户提交或受控的最终记录。",
    note: "报告完成后，正式交付使用无水印 PDF。",
  },
  {
    icon: FileType,
    format: "Word",
    bestFor: "客户或供应商需要可编辑文档时。",
    note: "保持在线报告作为唯一事实来源，避免副本产生偏差。",
  },
  {
    icon: FileSpreadsheet,
    format: "Excel",
    bestFor: "收件方期望表格化的措施、责任人和截止日期时。",
    note: "用于结构化评审，同时在报告中保留证据。",
  },
]

const faqs: SimpleFaq[] = [
  {
    question: "什么是 8D 报告模板？",
    answer:
      "8D 报告模板是一种结构化的纠正措施格式，引导团队从准备和围堵，经过根本原因、永久措施、验证、预防，直到关闭。",
  },
  {
    question: "8D 模板从 D0 还是 D1 开始？",
    answer:
      "许多组织在正式的 D1-D8 顺序之前使用 D0 作为准备步骤。包含 D0 有助于记录范围、紧急程度和启动 8D 的决定。",
  },
  {
    question: "这个模板可以用于供应商纠正措施要求（SCAR）吗？",
    answer:
      "可以。该结构适用于供应商 8D 回复、SCAR、客户投诉、反复出现的制造缺陷，以及其他基于证据的纠正措施调查。",
  },
  {
    question: "应该使用 Word、Excel 还是 PDF？",
    answer:
      "使用收件方要求的格式。PDF 最适合固定交付，Word 适合可编辑叙述，Excel 适合表格化的客户格式。",
  },
  {
    question: "我可以免费在线创建 8D 报告吗？",
    answer:
      "可以。免费版包含 3 份终身报告、完整的 D0-D8 编辑器、附件、只读分享和带水印 PDF 导出。",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

const templateStepsZh = [
  {
    id: "D0",
    title: "计划与准备",
    body: "确认该问题需要 8D，并定义客户、产品、批次、症状、紧急程度、受影响数量、初始负责人和首次回复范围。",
    details: "用这一步避免开启范围不清的宽泛报告。",
  },
  {
    id: "D1",
    title: "组建团队",
    body: "指派了解产品、流程、检测控制、客户影响和审批路径的人员。",
    details: "列出职能、职责、负责人和升级联系人。",
  },
  {
    id: "D2",
    title: "描述问题",
    body: "把投诉转化为可测量的问题陈述：什么、哪里、何时、谁、多少、频率、规格以及是/不是边界。",
    details: "扎实的 D2 让报告其余部分更容易验证。",
  },
  {
    id: "D3",
    title: "围堵问题",
    body: "在永久原因和纠正措施仍在验证期间保护客户。记录分选范围、库存位置、可疑日期、责任人和放行标准。",
    details: "围堵是临时保护，不是永久纠正。",
  },
  {
    id: "D4",
    title: "验证根本原因",
    body: "识别缺陷为何发生，以及现有控制为何允许它流出。记录发生原因、流出原因、证据和验证方法。",
    details: "当 5Why 或鱼骨图证据有助于推理可追溯时使用它们。",
  },
  {
    id: "D5",
    title: "选择纠正措施",
    body: "选择与经验证原因相关联的措施。包含责任人、截止日期、预期结果、风险评审和审批。",
    details: "每一项 D5 措施都应指向 D4 中的某个原因。",
  },
  {
    id: "D6",
    title: "实施并验证",
    body: "展示永久措施已在真实条件下完成且有效。包含实施日期、验证样本、结果和剩余风险。",
    details: "不要只用一个状态更新来关闭 D6。",
  },
  {
    id: "D7",
    title: "预防再发",
    body: "把经验扩展到类似产品、流程、文档、控制和团队。更新控制计划、PFMEA、作业指导书、培训、审核或部署责任人。",
    details: "D7 是把局部修复变成体系改进的地方。",
  },
  {
    id: "D8",
    title: "关闭并认可",
    body: "确认客户接受，关闭未完成措施，并为未来报告保留经验。",
    details: "记录最终审批人、客户回复和经验教训。",
  },
]

const blankTemplateTextZh = templateStepsZh
  .map((step) => `${step.id} - ${step.title}\n${step.body}\n`)
  .join("\n")

export default function ChineseEightDReportTemplatePage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <PageHero
        title="面向客户可用纠正措施的 8D 报告模板。"
        description="在线使用结构化的 D0-D8 工作流，需要时复制空白大纲，并按照客户要求的格式导出完成的回复。"
        actions={
          <>
            <PrimaryCTA href="/signup" page="8d_report_template_zh" location="hero">
              在线使用模板
            </PrimaryCTA>
            <CopyTemplateButton
              text={blankTemplateTextZh}
              page="8d_report_template_zh"
              location="hero"
            />
            <PrimaryCTA
              href="/zh/sample-report"
              page="8d_report_template_zh"
              location="hero"
              variant="ghost"
            >
              查看完整示例
            </PrimaryCTA>
          </>
        }
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              空白报告结构
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              D0-D8 提示已准备好用于问题描述、围堵、根本原因、纠正措施、验证、预防和关闭。
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["D2 事实", "D4 原因", "D6 验证"].map((item) => (
                <div key={item} className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageHero>

      <Section>
        <SectionHeader
          title="可复制的空白模板"
          description="当你只需要一个朴素结构时使用它；当证据、分享和导出控制变得重要时，把工作迁移到在线报告。"
        />
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-950 p-5">
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-100">
            {blankTemplateTextZh}
          </pre>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="D0-D8 指引"
          description="展开你需要的步骤。D2、D4 和 D5 默认展开，因为它们承载核心质量逻辑。"
        />
        <div className="mt-8">
          <StepAccordion
            items={templateStepsZh}
            defaultOpen={["D2", "D4", "D5"]}
            page="8d_report_template_zh"
          />
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="常见错误"
            description="多数薄弱的 8D 报告失败是因为逻辑不完整，而不是模板缺少字段。"
          />
          <div className="space-y-3">
            {commonMistakes.map((mistake) => (
              <div key={mistake} className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm leading-6 text-slate-700">{mistake}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="Word、Excel 还是 PDF？"
          description="选择收件方需要的格式，但在导出前保持报告和证据受控。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {formatGuidance.map((item) => (
            <article key={item.format} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {item.format}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.bestFor}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">{item.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            title="模板常见问题"
            description="为正在选择实用 8D 格式的团队准备的简短回答。"
          />
          <FaqAccordion
            groups={[{ title: "8D 模板", items: faqs }]}
            page="8d_report_template_zh"
          />
        </div>
      </Section>

      <Section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              准备好在线上使用模板了吗？
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              免费开始，使用完整的 D0-D8 编辑器、附件、分享和带水印 PDF 导出。
            </p>
          </div>
          <PrimaryCTA
            href="/signup"
            page="8d_report_template_zh"
            location="final_cta"
            className="bg-white text-slate-950 hover:bg-slate-100"
          >
            在线使用模板
          </PrimaryCTA>
        </div>
      </Section>
    </PageShell>
  )
}
