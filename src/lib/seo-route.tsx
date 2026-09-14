import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  getSeoPage,
  getSeoPagesByType,
  getSeoPathPrefix,
  type SeoPageType,
} from "@/content/seo-pages";
import { getSeoPageZh } from "@/content/seo-pages-zh";

const baseUrl = "https://www.8d-reports.com";

export function generateSeoStaticParams(type: SeoPageType) {
  const prefix = getSeoPathPrefix(type);
  return getSeoPagesByType(type).map((page) => ({
    slug: page.slug.replace(`${prefix}/`, ""),
  }));
}

export async function generateSeoMetadata(
  type: SeoPageType,
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(`${getSeoPathPrefix(type)}/${slug}`);
  if (!page) return {};

  const canonical = `${baseUrl}/${page.slug}`;
  // Every programmatic page has a Simplified Chinese equivalent, so the English
  // page advertises the translated pair for search engines.
  const zhUrl = getSeoPageZh(page.slug)
    ? `${baseUrl}/zh/${page.slug}`
    : undefined;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical,
      languages: zhUrl ? { en: canonical, "zh-CN": zhUrl } : { en: canonical },
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      siteName: "8D Reports",
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

export async function renderSeoPage(
  type: SeoPageType,
  params: Promise<{ slug: string }>
) {
  const { slug } = await params;
  const page = getSeoPage(`${getSeoPathPrefix(type)}/${slug}`);
  if (!page) notFound();

  return <SeoLandingPage page={page} />;
}

