import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { getLearnArticles } from "@/lib/content-library";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "8D 报告学习与教育",
  description:
    "关于 8D 报告、SCAR、Excel 替代方案、AI 辅助起草、供应商质量流程、导出、复核、锁定与修订历史的教育文章。",
  alternates: {
    canonical: `${siteUrl}/zh/learn`,
    languages: {
      en: `${siteUrl}/learn`,
      "zh-CN": `${siteUrl}/zh/learn`,
    },
  },
  openGraph: {
    title: "8D 报告学习与教育",
    description: "面向质量工程师和制造团队的实用 8D 与供应商质量教育内容。",
    url: `${siteUrl}/zh/learn`,
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: siteUrl },
  { label: "学习", href: `${siteUrl}/zh/learn` },
];

export default function ChineseLearnPage() {
  const articles = getLearnArticles("zh");

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
            学习
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            学习实用的 8D 报告工作方法。
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            面向质量工程师、SQE 和制造团队的 SEO 与产品教育文章。这些文章支持人工复核与发布
            流程，不自动对外发布内容。
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/zh/learn/${article.slug}`}
              className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <BookOpen className="h-4 w-4" />
                学习文章
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                {article.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                {article.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                阅读文章
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
