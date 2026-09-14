import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText } from "lucide-react";
import { PrimaryCTA } from "@/components/marketing/MarketingActions";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import {
  getRevenueGeoResourceZh,
  revenueGeoResourcesZh,
} from "@/content/revenue-geo-resources-zh";
import type { RevenueGeoResource } from "@/content/revenue-geo-resources";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return revenueGeoResourcesZh.map((resource) => ({ slug: resource.slug }));
}

const intentLabel: Record<RevenueGeoResource["intent"], string> = {
  informational: "信息型",
  commercial: "商业型",
  service: "服务型",
  template: "模板型",
  comparison: "对比型",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = getRevenueGeoResourceZh(slug);
  if (!resource) return {};

  const url = `${siteUrl}/zh/resources/${resource.slug}`;
  const enUrl = `${siteUrl}/resources/${resource.slug}`;
  return {
    title: resource.metaTitle,
    description: resource.metaDescription,
    alternates: {
      canonical: url,
      languages: { en: enUrl, "zh-CN": url },
    },
    openGraph: {
      title: resource.metaTitle,
      description: resource.metaDescription,
      url,
      type: "article",
      images: [socialOpenGraphImage],
    },
  };
}

export default async function ChineseRevenueGeoResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = getRevenueGeoResourceZh(slug);
  if (!resource) notFound();

  const resourceUrl = `${siteUrl}/zh/resources/${resource.slug}`;
  const breadcrumbItems = [
    { label: "首页", href: siteUrl },
    { label: "资源", href: `${siteUrl}/zh/resources` },
    { label: resource.title, href: resourceUrl },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: resource.faq.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: resource.metaTitle,
    description: resource.metaDescription,
    inLanguage: "zh-CN",
    url: resourceUrl,
    publisher: {
      "@type": "Organization",
      name: "8D Reports",
      url: siteUrl,
    },
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={articleJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1fr_0.85fr] lg:items-start lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
              {resource.category}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {resource.h1}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              {resource.answer}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryCTA
                href={resource.primaryCta.href}
                page={`resource_${resource.slug}`}
                location="hero"
                eventName={resource.primaryCta.eventName}
                eventData={resource.primaryCta.eventData}
              >
                {resource.primaryCta.label}
              </PrimaryCTA>
              <PrimaryCTA
                href={resource.secondaryCta.href}
                page={`resource_${resource.slug}`}
                location="hero"
                variant="secondary"
              >
                {resource.secondaryCta.label}
              </PrimaryCTA>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-950">
                答案优先摘要
              </h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">目标查询</dt>
                <dd className="mt-1 text-slate-600">{resource.targetQuery}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">搜索意图</dt>
                <dd className="mt-1 text-slate-600">{intentLabel[resource.intent]}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">需要准备的证据</dt>
                <dd className="mt-2">
                  <ul className="space-y-2 text-slate-600">
                    {resource.proofElements.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="实用检查清单"
            description="在报告发送、导出或作为可复用知识资产之前，用这份清单做一次工作评审。"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {resource.checklist.map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="mt-3 text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader title={resource.table.title} />
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-3 bg-slate-950 text-sm font-semibold text-white">
            {resource.table.columns.map((column) => (
              <div key={column} className="px-4 py-3">
                {column}
              </div>
            ))}
          </div>
          {resource.table.rows.map((row) => (
            <div key={row.join("|")} className="grid grid-cols-3 border-t border-slate-200 text-sm">
              {row.map((cell) => (
                <div key={cell} className="min-w-0 px-4 py-4 leading-6 text-slate-700">
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-7">
            {resource.sections.map((section) => (
              <article key={section.title}>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {section.title}
                </h2>
                <p className="mt-3 text-base leading-8 text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>
          <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <h2 className="text-base font-semibold text-slate-950">常见错误</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              {resource.mistakes.map((mistake) => (
                <li key={mistake} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            title="相关资源"
            description="当问题变得紧急时，从文章进入示例、产品工作流或定价细节。"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {resource.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <FileText className="mb-3 h-4 w-4 text-indigo-600" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            title="常见问题"
            description="为正在评审这一主题的质量团队准备的简短回答。"
          />
          <div className="space-y-4">
            {resource.faq.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-slate-200 p-5">
                <h2 className="text-base font-semibold text-slate-950">{faq.question}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
