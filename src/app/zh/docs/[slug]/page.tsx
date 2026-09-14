import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { DocsSidebar, DocsTopicSelector } from "@/components/marketing/DocsNav";
import { PrimaryCTA } from "@/components/marketing/MarketingActions";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { docsTopicsZh, getDocsTopicZh } from "@/lib/marketing-content-zh";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return docsTopicsZh.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getDocsTopicZh(slug);
  if (!topic) return {};

  const url = `${siteUrl}/zh/docs/${topic.slug}`;
  const enUrl = `${siteUrl}/docs/${topic.slug}`;
  return {
    title: `${topic.title} | 产品文档`,
    description: topic.summary,
    alternates: {
      canonical: url,
      languages: { en: enUrl, "zh-CN": url },
    },
    openGraph: {
      title: `${topic.title} | 产品文档`,
      description: topic.summary,
      url,
      type: "article",
      images: [socialOpenGraphImage],
    },
  };
}

export default async function ChineseDocsTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getDocsTopicZh(slug);
  if (!topic) notFound();

  const index = docsTopicsZh.findIndex((item) => item.slug === topic.slug);
  const previous = docsTopicsZh[index - 1];
  const next = docsTopicsZh[index + 1];
  const breadcrumbItems = [
    { label: "首页", href: siteUrl },
    { label: "使用文档", href: `${siteUrl}/zh/docs` },
    { label: topic.title, href: `${siteUrl}/zh/docs/${topic.slug}` },
  ];

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {topic.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {topic.summary}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[260px_1fr]">
          <DocsSidebar topics={docsTopicsZh} label="使用文档" />
          <article className="min-w-0">
            <DocsTopicSelector
              topics={docsTopicsZh}
              label="文档主题"
              overviewLabel="文档总览"
            />
            <div className="mt-8 lg:mt-0">
              <h2 className="text-xl font-semibold text-slate-950">步骤</h2>
              <ol className="mt-5 space-y-4">
                {topic.steps.map((step, stepIndex) => (
                  <li key={step} className="grid gap-3 sm:grid-cols-[44px_1fr]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 font-mono text-sm font-semibold text-indigo-700">
                      {stepIndex + 1}
                    </span>
                    <p className="text-base leading-7 text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-lg border border-indigo-100 bg-indigo-50 p-5">
                <div className="flex gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
                  <div>
                    <h2 className="text-base font-semibold text-indigo-950">
                      说明
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-indigo-900">
                      {topic.callout}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {previous ? (
                  <Link
                    href={`/zh/docs/${previous.slug}`}
                    className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      上一篇
                    </span>
                    <p className="mt-2 font-semibold text-slate-950">
                      {previous.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {next ? (
                  <Link
                    href={`/zh/docs/${next.slug}`}
                    className="rounded-lg border border-slate-200 p-5 text-right transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      下一篇
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 font-semibold text-slate-950">
                      {next.title}
                    </p>
                  </Link>
                ) : null}
              </div>

              <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  仍需要帮助？
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  发送报告、导出、分享或计费问题的背景，我们会帮助你选择最安全的下一步。
                </p>
                <div className="mt-5">
                  <PrimaryCTA
                    href="/zh/contact"
                    page="docs"
                    location={`zh_topic_${topic.slug}_help`}
                    variant="secondary"
                  >
                    联系支持
                  </PrimaryCTA>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
