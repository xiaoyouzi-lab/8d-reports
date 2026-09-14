import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import {
  ArticleMediaReferences,
  MarkdownArticleBody,
} from "@/components/marketing/ContentArticle";
import { PrimaryCTA } from "@/components/marketing/MarketingActions";
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives";
import { getLearnArticle, getLearnArticles } from "@/lib/content-library";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getLearnArticles("zh").map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticle(slug, "zh");
  if (!article) return {};

  const url = `${siteUrl}/zh/learn/${article.slug}`;
  const enUrl = `${siteUrl}/learn/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: url,
      languages: { en: enUrl, "zh-CN": url },
    },
    keywords: article.targetKeywords,
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      type: "article",
      images: [socialOpenGraphImage],
    },
  };
}

export default async function ChineseLearnArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLearnArticle(slug, "zh");
  if (!article) notFound();

  const articles = getLearnArticles("zh");
  const index = articles.findIndex((item) => item.slug === article.slug);
  const previous = articles[index - 1];
  const next = articles[index + 1];
  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const url = `${siteUrl}/zh/learn/${article.slug}`;
  const breadcrumbItems = [
    { label: "首页", href: siteUrl },
    { label: "学习", href: `${siteUrl}/zh/learn` },
    { label: article.title, href: url },
  ];
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: "zh-CN",
    url,
    dateModified: article.lastReviewed,
    publisher: {
      "@type": "Organization",
      name: "8D Reports",
      url: siteUrl,
    },
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={articleJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <BookOpen className="h-4 w-4" />
            学习
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {article.description}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0">
            <ArticleMediaReferences
              screenshots={article.screenshots}
              videos={article.videos}
              className="mb-8"
            />
            <MarkdownArticleBody body={article.body} />

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={`/zh/learn/${previous.slug}`}
                  className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    上一篇
                  </span>
                  <p className="mt-2 font-semibold text-slate-950">{previous.title}</p>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/zh/learn/${next.slug}`}
                  className="rounded-lg border border-slate-200 p-5 text-right transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    下一篇
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <p className="mt-2 font-semibold text-slate-950">{next.title}</p>
                </Link>
              ) : null}
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                本页目录
              </p>
              <nav className="mt-3 space-y-2">
                {article.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm leading-5 text-slate-600 hover:text-indigo-700"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-base font-semibold text-slate-950">
                相关文章
              </h2>
              <div className="mt-3 space-y-3">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/zh/learn/${item.slug}`}
                    className="block text-sm font-medium leading-5 text-indigo-700 hover:text-indigo-900"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
              <h2 className="text-base font-semibold text-indigo-950">
                写入报告
              </h2>
              <p className="mt-2 text-sm leading-6 text-indigo-900">
                使用产品流程完成复核、证据和导出准备。
              </p>
              <div className="mt-4">
                <PrimaryCTA href="/signup" page="learn" location={`article_${article.slug}`}>
                  免费开始
                </PrimaryCTA>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
