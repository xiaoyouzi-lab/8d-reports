import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocsSidebar, DocsTopicSelector } from "@/components/marketing/DocsNav";
import { PrimaryCTA } from "@/components/marketing/MarketingActions";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { docsTopicsZh } from "@/lib/marketing-content-zh";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "产品文档：报告、导出与分享",
  description:
    "了解如何创建报告、编辑 D0-D8、管理附件、导出 PDF、Word 或 Excel、在存在附件时打包、分享报告、使用 Team，以及查看 AI 质量检查。",
  alternates: {
    canonical: `${siteUrl}/zh/docs`,
    languages: {
      en: `${siteUrl}/docs`,
      "zh-CN": `${siteUrl}/zh/docs`,
    },
  },
  openGraph: {
    title: "产品文档：报告、导出与分享",
    description: "用于创建、编辑、导出、分享和评审 8D 报告的实用产品文档。",
    url: `${siteUrl}/zh/docs`,
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: siteUrl },
  { label: "使用文档", href: `${siteUrl}/zh/docs` },
];

export default function ChineseDocsPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            用于完成客户就绪 8D 报告的产品文档。
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            从创建报告、编辑 D0-D8、附加证据，到导出 PDF / Word / Excel、在存在附件时打包、分享、Team
            工作流、计费、安全与 AI 质量检查的简明操作指南。
          </p>
          <div className="mt-8">
            <PrimaryCTA
              href="/zh/docs/getting-started"
              page="docs"
              location="zh_hero"
            >
              从快速开始入手
            </PrimaryCTA>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[260px_1fr]">
          <DocsSidebar topics={docsTopicsZh} label="使用文档" />
          <div>
            <DocsTopicSelector
              topics={docsTopicsZh}
              label="文档主题"
              overviewLabel="文档总览"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:mt-0">
              {docsTopicsZh.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/zh/docs/${topic.slug}`}
                  className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <h2 className="text-base font-semibold text-slate-950">
                    {topic.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {topic.summary}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                    阅读主题
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
