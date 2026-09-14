import type { Metadata } from "next";
import { PrimaryCTA } from "@/components/marketing/MarketingActions";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "常见问题：方案、导出、分享、安全与 AI",
  description:
    "关于免费报告、账单、PDF Word Excel 导出、附件、分享、Team 工作流、安全和 AI 质量检查的解答。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/faq",
    languages: {
      en: "https://www.8d-reports.com/faq",
      "zh-CN": "https://www.8d-reports.com/zh/faq",
    },
  },
  openGraph: {
    title: "常见问题：方案、导出、分享、安全与 AI",
    description: "8D Reports 的方案、导出、分享、Team 工作流、安全和 AI 解答。",
    url: "https://www.8d-reports.com/zh/faq",
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: "https://www.8d-reports.com/zh" },
  { label: "常见问题", href: "https://www.8d-reports.com/zh/faq" },
];

const faqGroups = [
  {
    title: "开始使用",
    items: [
      {
        question: "是免费的吗？",
        answer:
          "是的。免费方案包含 3 份终身报告、完整的 D0-D8 编辑器、附件、仅查看分享，以及带水印 PDF 导出。",
      },
      {
        question: "需要信用卡吗？",
        answer: "不需要。你可以直接开始免费方案并创建报告，无需填写信用卡。",
      },
      {
        question: "用完 3 份报告后会怎样？",
        answer:
          "现有报告仍可访问。继续创建报告需要 Pro 或 Team；也可以对一份选定报告使用一次性导出。",
      },
    ],
  },
  {
    title: "报告与导出",
    items: [
      {
        question: "可以导出 PDF、Word 和 Excel 吗？",
        answer:
          "可以。免费方案导出带水印 PDF。Pro、Team 和单份报告导出可解锁无水印 PDF、Word 和 Excel，用于正式交付。",
      },
      {
        question: "4.99 美元的单份导出包含什么？",
        answer:
          "它解锁一份选定报告的无水印 PDF、Word 和 Excel 导出，但不包含无限报告、公司 Logo、可编辑分享或 Pro 检索。",
      },
      {
        question: "是否包含附件？",
        answer:
          "附件可以添加到报告的各个步骤。当报告存在附件时，所选报告格式与附件文件会一起下载为 ZIP 包。",
      },
    ],
  },
  {
    title: "分享与团队",
    items: [
      {
        question: "供应商或客户可以编辑报告吗？",
        answer:
          "免费分享是仅查看。当外部或内部协作方需要直接参与时，Pro 和 Team 提供可编辑分享。",
      },
      {
        question: "Team 包含什么？",
        answer:
          "Team 包含 Pro 功能、5 个席位、共享工作区、负责人 / 编辑 / 只读角色、审批与锁定、修订，以及活动记录。",
      },
    ],
  },
  {
    title: "账单与方案",
    items: [
      {
        question: "可以取消吗？",
        answer:
          "取消或调整账单请联系支持。订阅状态由账单服务商更新，并在账单事件处理完成后反映到产品中。",
      },
      {
        question: "可以只为一份报告付费吗？",
        answer:
          "可以。单份导出面向只需要一份正式客户可交付文件、不需要持续使用 Pro 或 Team 功能的用户。",
      },
    ],
  },
  {
    title: "安全与 AI",
    items: [
      {
        question: "数据存储在哪里？",
        answer:
          "应用数据存储在产品的数据库中，上传文件存储在配置的对象存储中。安全细节记录在安全页面。",
      },
      {
        question: "AI 会自动批准报告吗？",
        answer:
          "不会。AI 质量检查是测试版助手，可以提示可能的缺口，但不会批准、认证或替代工程评审。",
      },
      {
        question: "可以删除我的数据吗？",
        answer:
          "你可以在应用内编辑自己控制的报告内容，并在提供该功能的位置删除附件或分享链接。关于账号级、整份报告或工作区级的删除问题，请联系支持以便安全处理。",
      },
    ],
  },
];

const allFaqs = faqGroups.flatMap((group) => group.items);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function ChineseFaqPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            常见问题
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            关于免费开始、导出正式交付件、分享报告、团队工作流、数据处理和 AI 质量检查的实用解答。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCTA href="/zh/signup" page="faq" location="zh_hero">
              免费开始，含 3 份报告
            </PrimaryCTA>
            <PrimaryCTA href="/docs" page="faq" location="zh_hero" variant="secondary">
              查看使用文档
            </PrimaryCTA>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            title="按主题查看解答"
            description="打开与你当前决策最相关的分类。"
          />
          <FaqAccordion groups={faqGroups} page="zh_faq" />
        </div>
      </Section>
    </PageShell>
  );
}
