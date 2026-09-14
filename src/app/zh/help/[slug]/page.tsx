import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
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
import { getHelpArticle, getHelpArticles } from "@/lib/content-library";
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content";

export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getHelpArticles("zh").map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug, "zh");
  if (!article) return {};

  const url = `${siteUrl}/zh/help/${article.slug}`;
  const enUrl = `${siteUrl}/help/${article.slug}`;
  return {
    title: `${article.title} | 帮助中心`,
    description: article.description,
    alternates: {
      canonical: url,
      languages: { en: enUrl, "zh-CN": url },
    },
    openGraph: {
      title: `${article.title} | 帮助中心`,
      description: article.description,
      url,
      type: "article",
      images: [socialOpenGraphImage],
    },
  };
}

export default async function ChineseHelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getHelpArticle(slug, "zh");
  if (!article) notFound();

  const articles = getHelpArticles("zh");
  const index = articles.findIndex((item) => item.slug === article.slug);
  const previous = articles[index - 1];
  const next = articles[index + 1];
  const url = `${siteUrl}/zh/help/${article.slug}`;
  const breadcrumbItems = [
    { label: "首页", href: siteUrl },
    { label: "帮助", href: `${siteUrl}/zh/help` },
    { label: article.title, href: url },
  ];

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
            {article.category || "帮助"}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {article.description}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[230px_1fr_240px]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-3">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                帮助中心
              </p>
              <nav className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                {articles.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/zh/help/${item.slug}`}
                    className={
                      item.slug === article.slug
                        ? "block rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                        : "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                    }
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

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
                  href={`/zh/help/${previous.slug}`}
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
                  href={`/zh/help/${next.slug}`}
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

            <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">下一步</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                先查看相关帮助主题，然后创建一份测试报告；如果你正在准备团队推广，也可以联系支持。
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCTA href="/zh/signup" page="help" location={`article_${article.slug}`}>
                  开始创建报告
                </PrimaryCTA>
                <PrimaryCTA
                  href="/zh/contact"
                  page="help"
                  location={`article_${article.slug}_contact`}
                  variant="secondary"
                >
                  联系支持
                </PrimaryCTA>
              </div>
            </div>
          </article>

          <aside className="hidden xl:block">
            <div className="sticky top-20 space-y-5">
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
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                  <p className="text-sm leading-6 text-indigo-950">
                    最终客户提交和对外发布仍需由责任人确认。
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
