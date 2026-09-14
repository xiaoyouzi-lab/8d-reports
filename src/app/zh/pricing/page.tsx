import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileDown } from "lucide-react";
import { AutoCheckout } from "@/components/AutoCheckout";
import {
  PrimaryCTA,
  TrackedCheckoutButton,
} from "@/components/marketing/MarketingActions";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { PlanCard } from "@/components/marketing/PlanCard";
import { socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "定价：免费、Pro、Team 与单份导出",
  description:
    "先用 3 份免费报告评估流程。需要正式交付时升级 Pro，需要共享控制时选择 Team，也可以只解锁一份选定报告。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/pricing",
    languages: {
      en: "https://www.8d-reports.com/pricing",
      "zh-CN": "https://www.8d-reports.com/zh/pricing",
    },
  },
  openGraph: {
    title: "定价：免费、Pro、Team 与单份导出",
    description:
      "适合质量工程师、供应商质量与制造团队的 8D 交付和协作定价。",
    url: "https://www.8d-reports.com/zh/pricing",
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: "https://www.8d-reports.com/zh" },
  { label: "定价", href: "https://www.8d-reports.com/zh/pricing" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "永久",
    description: "用于评估流程，最多创建 3 份终身报告。",
    features: ["3 份终身报告", "D0-D8 编辑器", "附件", "仅查看分享", "带水印 PDF"],
  },
  {
    name: "Pro",
    price: "$19",
    period: "月",
    description: "适合需要持续交付报告的个人质量工程师。",
    recommended: true,
    features: [
      "个人无限报告",
      "无水印 PDF",
      "Word 与 Excel 导出",
      "公司 Logo",
      "可编辑分享",
      "深度历史检索",
    ],
  },
  {
    name: "Team",
    price: "$99",
    period: "月",
    description: "适合需要共享报告控制的小型质量团队。",
    features: [
      "包含 Pro 全部能力",
      "5 个席位",
      "共享工作区",
      "负责人 / 编辑 / 只读角色",
      "审批状态、报告锁定与修订",
      "活动日志",
    ],
  },
];

const comparisonRows = [
  ["报告", "3 份终身", "个人无限报告", "共享工作区"],
  ["PDF 导出", "带水印", "无水印", "无水印"],
  ["Word 与 Excel", "仅单份解锁", "已包含", "已包含"],
  ["分享", "仅查看", "可编辑", "按角色协作"],
  ["团队控制", "—", "—", "角色、审批、锁定"],
];

const billingFaqs = [
  {
    question: "免费方案需要信用卡吗？",
    answer: "不需要。免费方案包含 3 份终身报告，无需信用卡。",
  },
  {
    question: "用完 3 份报告后会怎样？",
    answer:
      "现有报告仍可访问。继续创建报告需要 Pro 或 Team；也可以只对一份选定报告使用单份导出。",
  },
  {
    question: "单份导出能解锁什么？",
    answer:
      "单份导出为 4.99 美元，解锁一份选定报告的无水印 PDF、Word 和 Excel 导出。",
  },
  {
    question: "可以取消订阅吗？",
    answer:
      "取消或调整账单请联系支持。订阅状态由账单服务商更新，并在账单事件处理完成后反映到产品中。",
  },
  {
    question: "Team 是否包含企业采购能力？",
    answer:
      "Team 是一个轻量级的共享 8D 工作区。若需要更广泛的企业级部署要求，请先查看安全页面或联系我们。",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: billingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function ChinesePricingPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              先用 3 份免费报告评估。需要正式交付或团队控制时再付费。
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Free 用于评估，Pro 用于个人持续交付，Team 用于带评审控制的共享质量工作区。
            </p>
          </div>

          <Suspense fallback={null}>
            <AutoCheckout />
          </Suspense>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                recommended={plan.recommended}
                recommendedLabel="推荐"
              >
                {plan.name === "Free" ? (
                  <PrimaryCTA
                    href="/zh/signup"
                    page="pricing"
                    location="zh_free_plan"
                    variant="secondary"
                    className="w-full"
                    eventName="pricing_plan_clicked"
                    eventData={{ plan: "free" }}
                  >
                    免费开始
                  </PrimaryCTA>
                ) : plan.name === "Pro" ? (
                  <TrackedCheckoutButton
                    plan="pro"
                    planType="pro_monthly"
                    className="h-11 w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    开始 Pro 月度订阅
                  </TrackedCheckoutButton>
                ) : (
                  <TrackedCheckoutButton
                    plan="team"
                    planType="team_monthly"
                    className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
                  >
                    开始 Team 月度订阅
                  </TrackedCheckoutButton>
                )}
              </PlanCard>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="单份报告导出"
            description="只需一份正式交付件、无需持续使用 Pro 或 Team 功能时，可在该报告的导出流程中选择单份解锁。"
          />
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-5">
            <div className="flex gap-3">
              <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
              <div>
                <h2 className="text-lg font-semibold text-indigo-950">
                  4.99 美元解锁一份选定报告
                </h2>
                <ul className="mt-4 grid gap-2 text-sm text-indigo-900 sm:grid-cols-3">
                  <li>无水印 PDF</li>
                  <li>Word</li>
                  <li>Excel</li>
                </ul>
                <p className="mt-4 text-sm leading-6 text-indigo-900">
                  单份导出从报告导出流程发起，确保所选报告清晰明确。
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-600">
          关于安全、数据和推广问题，请查看{" "}
          <Link href="/zh/security" className="font-semibold text-indigo-700 hover:text-indigo-800">
            安全与隐私
          </Link>
          。
        </p>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="能力对比"
          description="主要差别在于何时需要正式导出、可复用历史记录或团队控制。"
        />
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[720px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-950">能力</th>
                <th className="px-4 py-3 font-semibold text-slate-950">Free</th>
                <th className="px-4 py-3 font-semibold text-slate-950">Pro</th>
                <th className="px-4 py-3 font-semibold text-slate-950">Team</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row[0]} className="border-b border-slate-100 last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${row[0]}-${cellIndex}`} className="px-4 py-3 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="border-t border-slate-200 bg-slate-50">
        <SectionHeader title="账单常见问题" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {billingFaqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
