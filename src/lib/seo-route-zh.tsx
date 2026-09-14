import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPageZh } from "@/components/seo/SeoLandingPageZh";
import { getSeoPathPrefix, type SeoPageType } from "@/content/seo-pages";
import { getSeoPageZh, getSeoPagesByTypeZh } from "@/content/seo-pages-zh";

const baseUrl = "https://www.8d-reports.com";

export function generateSeoZhStaticParams(type: SeoPageType) {
  const prefix = getSeoPathPrefix(type);
  return getSeoPagesByTypeZh(type).map((page) => ({
    slug: page.slug.replace(`${prefix}/`, ""),
  }));
}

export async function generateSeoZhMetadata(
  type: SeoPageType,
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPageZh(`${getSeoPathPrefix(type)}/${slug}`);
  if (!page) return {};

  const zhUrl = `${baseUrl}/zh/${page.slug}`;
  const enUrl = `${baseUrl}/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: zhUrl,
      languages: { en: enUrl, "zh-CN": zhUrl },
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: zhUrl,
      siteName: "8D Reports",
      type: "article",
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

export async function renderSeoZhPage(
  type: SeoPageType,
  params: Promise<{ slug: string }>
) {
  const { slug } = await params;
  const page = getSeoPageZh(`${getSeoPathPrefix(type)}/${slug}`);
  if (!page) notFound();

  return <SeoLandingPageZh page={page} />;
}
