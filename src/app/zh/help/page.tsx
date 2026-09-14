import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { getHelpArticles } from "@/lib/content-library";
import { slugify } from "@/lib/slugify";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "帮助中心",
  description:
    "面向 8D Reports 各模块的实用帮助：D0-D8 编辑、AI 初稿、AI 质量检查、证据、流程、共享、导出、定价和故障排查。",
  alternates: {
    canonical: `${siteUrl}/zh/help`,
    languages: {
      en: `${siteUrl}/help`,
      "zh-CN": `${siteUrl}/zh/help`,
    },
  },
  openGraph: {
    title: "8D Reports 帮助中心",
    description: "创建、复核、共享和导出可交付客户 8D 报告的产品帮助。",
    url: `${siteUrl}/zh/help`,
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: siteUrl },
  { label: "帮助", href: `${siteUrl}/zh/help` },
];

export default function ChineseHelpPage() {
  const articles = getHelpArticles("zh");
  const categories = Array.from(new Set(articles.map((article) => article.category || "帮助")));

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
            帮助
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            8D Reports 帮助中心。
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            按模块了解如何创建报告、完成 D0-D8、保守使用 AI 辅助、管理证据、查看流程状态、
            共享、导出以及排查故障。
          </p>
          <div className="mt-8 max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3">
              <Search className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <p className="text-sm leading-6 text-slate-700">
                可使用浏览器的页内查找，或打开某篇文章查看页级目录。
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-3">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                帮助分组
              </p>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <a
                    key={category}
                    href={`#${slugify(category)}`}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  >
                    {category}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-10">
            {categories.map((category) => {
              const items = articles.filter((article) => (article.category || "帮助") === category);
              return (
                <section
                  key={category}
                  id={slugify(category)}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {category}
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {items.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/zh/help/${article.slug}`}
                        className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <h3 className="text-base font-semibold text-slate-950">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {article.description}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                          查看帮助
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
