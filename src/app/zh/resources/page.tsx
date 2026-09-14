import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { revenueGeoResourcesZh } from "@/content/revenue-geo-resources-zh";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "8D 模板、示例与根因工具",
  description:
    "浏览面向制造质量团队的实用 8D 资源：客户投诉、供应商纠正措施（SCAR）、根因分析、纠正措施、验证与经验教训。",
  alternates: {
    canonical: `${siteUrl}/zh/resources`,
    languages: {
      en: `${siteUrl}/resources`,
      "zh-CN": `${siteUrl}/zh/resources`,
    },
  },
  openGraph: {
    title: "8D 模板、示例与根因工具",
    description: "面向质量工程师、SQE 和制造质量团队的实用 8D 资源。",
    url: `${siteUrl}/zh/resources`,
    type: "website",
    images: [socialOpenGraphImage],
  },
};

const breadcrumbItems = [
  { label: "首页", href: siteUrl },
  { label: "资源", href: `${siteUrl}/zh/resources` },
];

export default function ChineseResourcesPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
            资源
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            面向制造质量团队的实用 8D 资源。
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            为客诉、供应商问题、根因分析、纠正措施和复发预防找到实用的结构化做法。
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {revenueGeoResourcesZh.map((resource) => (
            <article
              key={resource.slug}
              className="flex min-h-[220px] flex-col rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                {resource.category}
              </p>
              <h2 className="mt-3 text-base font-semibold leading-6 text-slate-950">
                {resource.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {resource.metaDescription}
              </p>
              <Link
                href={`/zh/resources/${resource.slug}`}
                className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                <FileText className="h-4 w-4" />
                查看资源
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
