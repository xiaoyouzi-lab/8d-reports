import type { MetadataRoute } from "next"
import { revenueGeoResources } from "@/content/revenue-geo-resources"
import {
  getRevenueGeoResourceZh,
  revenueGeoResourcesZh,
} from "@/content/revenue-geo-resources-zh"
import { seoPages as legacySeoPages } from "@/lib/seo-pages"
import { seoPages as programmaticSeoPages } from "@/content/seo-pages"
import { seoPagesZh as programmaticSeoPagesZh } from "@/content/seo-pages-zh"
import {
  getHelpArticle,
  getHelpArticles,
  getLearnArticle,
  getLearnArticles,
} from "@/lib/content-library"
import { ZH_DEMO_REPORT_SLUGS, ZH_ROUTE_MAP, zhPathFor } from "@/lib/i18n-routes"
import { docsTopicZhSlugs, docsTopicsZh } from "@/lib/marketing-content-zh"
import { INDEXABLE_STATIC_PATHS, SITE_URL } from "@/lib/seo-index-hygiene"

type SitemapAlternates = MetadataRoute.Sitemap[number]["alternates"]

function absoluteUrl(path: string) {
  return path.startsWith("https://") ? path : `${SITE_URL}${path === "/" ? "" : path}`
}

// Every core marketing page links to its Chinese counterpart (and back) so
// search engines can treat the two URLs as one translated cluster.
function languageAlternates(enPath: string, zhPath: string): SitemapAlternates {
  return {
    languages: {
      en: absoluteUrl(enPath),
      "zh-CN": absoluteUrl(zhPath),
    },
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const seen = new Set<string>()

  function entry(
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
    alternates?: SitemapAlternates,
  ): MetadataRoute.Sitemap[number] | null {
    const url = absoluteUrl(path)
    if (seen.has(url)) return null
    seen.add(url)
    return {
      url,
      lastModified: now,
      changeFrequency,
      priority,
      ...(alternates ? { alternates } : {}),
    }
  }

  // /docs/<slug> and /zh/docs/<slug> are translated pairs, but the dynamic
  // docs routes cannot live in ZH_ROUTE_MAP. Match them explicitly so the
  // English entries carry the same alternates as the Chinese ones.
  const translatedDocsSlugs = new Set<string>(docsTopicZhSlugs)

  const staticEntries = INDEXABLE_STATIC_PATHS
    .map((path) => {
      // Static pairs come from ZH_ROUTE_MAP; dynamic collections such as
      // /demo-reports/[type] resolve through zhPathFor.
      const zhPath = ZH_ROUTE_MAP[path] ?? zhPathFor(path)
      const docsSlug = path.startsWith("/docs/")
        ? path.slice("/docs/".length)
        : undefined
      const alternates = zhPath
        ? languageAlternates(path, zhPath)
        : docsSlug && translatedDocsSlugs.has(docsSlug)
          ? languageAlternates(path, `/zh/docs/${docsSlug}`)
          : undefined
      return entry(
        path,
        path === "/" ? "weekly" : "monthly",
        path === "/" ? 1 : 0.8,
        alternates,
      )
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  // /demo-reports/<type> is a dynamic collection, so its Chinese URLs are not
  // in ZH_ROUTE_MAP. Add both directions explicitly.
  const demoZhEntries = ZH_DEMO_REPORT_SLUGS
    .map((type) => {
      const enPath = `/demo-reports/${type}`
      const zhPath = `/zh/demo-reports/${type}`
      return entry(zhPath, "weekly", 0.85, languageAlternates(enPath, zhPath))
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const chineseEntries = Object.entries(ZH_ROUTE_MAP)
    .map(([enPath, zhPath]) =>
      entry(
        zhPath,
        zhPath === "/zh" ? "weekly" : "monthly",
        zhPath === "/zh" ? 1 : 0.8,
        languageAlternates(enPath, zhPath),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const legacyEntries = legacySeoPages
    .map((page) => {
      const enPath = `/${page.slug}`
      const zhPath = zhPathFor(enPath)
      return entry(
        enPath,
        "weekly",
        0.85,
        zhPath ? languageAlternates(enPath, zhPath) : undefined,
      )
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const programmaticEntries = programmaticSeoPages
    .map((page) =>
      entry(
        `/${page.slug}`,
        "weekly",
        0.82,
        languageAlternates(`/${page.slug}`, `/zh/${page.slug}`),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const programmaticZhEntries = programmaticSeoPagesZh
    .map((page) =>
      entry(
        `/zh/${page.slug}`,
        "weekly",
        0.82,
        languageAlternates(`/${page.slug}`, `/zh/${page.slug}`),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const revenueResourceEntries = revenueGeoResources
    .map((page) => {
      const enPath = `/resources/${page.slug}`
      const zhPath = `/zh/resources/${page.slug}`
      const alternates = getRevenueGeoResourceZh(page.slug)
        ? languageAlternates(enPath, zhPath)
        : undefined
      return entry(enPath, "weekly", 0.82, alternates)
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const revenueResourceZhEntries = revenueGeoResourcesZh
    .map((page) =>
      entry(
        `/zh/resources/${page.slug}`,
        "weekly",
        0.82,
        languageAlternates(`/resources/${page.slug}`, `/zh/resources/${page.slug}`),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const helpEntries = getHelpArticles()
    .map((page) => {
      const enPath = `/help/${page.slug}`
      const zhPath = `/zh/help/${page.slug}`
      const alternates = getHelpArticle(page.slug, "zh")
        ? languageAlternates(enPath, zhPath)
        : undefined
      return entry(enPath, "monthly", 0.75, alternates)
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const helpZhEntries = getHelpArticles("zh")
    .map((page) =>
      entry(
        `/zh/help/${page.slug}`,
        "monthly",
        0.75,
        languageAlternates(`/help/${page.slug}`, `/zh/help/${page.slug}`),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const learnEntries = getLearnArticles()
    .map((page) => {
      const enPath = `/learn/${page.slug}`
      const zhPath = `/zh/learn/${page.slug}`
      const alternates = getLearnArticle(page.slug, "zh")
        ? languageAlternates(enPath, zhPath)
        : undefined
      return entry(enPath, "weekly", 0.8, alternates)
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const docsZhEntries = docsTopicsZh
    .map((topic) =>
      entry(
        `/zh/docs/${topic.slug}`,
        "monthly",
        0.8,
        languageAlternates(`/docs/${topic.slug}`, `/zh/docs/${topic.slug}`),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const learnZhEntries = getLearnArticles("zh")
    .map((page) =>
      entry(
        `/zh/learn/${page.slug}`,
        "weekly",
        0.8,
        languageAlternates(`/learn/${page.slug}`, `/zh/learn/${page.slug}`),
      ),
    )
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  return [
    ...staticEntries,
    ...chineseEntries,
    ...legacyEntries,
    ...demoZhEntries,
    ...programmaticEntries,
    ...programmaticZhEntries,
    ...revenueResourceEntries,
    ...revenueResourceZhEntries,
    ...helpEntries,
    ...helpZhEntries,
    ...learnEntries,
    ...learnZhEntries,
    ...docsZhEntries,
  ]
}
