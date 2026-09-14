import type { MetadataRoute } from "next"
import { revenueGeoResources } from "@/content/revenue-geo-resources"
import { seoPages as legacySeoPages } from "@/lib/seo-pages"
import { seoPages as programmaticSeoPages } from "@/content/seo-pages"
import { getHelpArticles, getLearnArticles } from "@/lib/content-library"
import { ZH_ROUTE_MAP } from "@/lib/i18n-routes"
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

  const staticEntries = INDEXABLE_STATIC_PATHS
    .map((path) => {
      const zhPath = ZH_ROUTE_MAP[path]
      return entry(
        path,
        path === "/" ? "weekly" : "monthly",
        path === "/" ? 1 : 0.8,
        zhPath ? languageAlternates(path, zhPath) : undefined,
      )
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
    .map((page) => entry(`/${page.slug}`, "weekly", 0.85))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const programmaticEntries = programmaticSeoPages
    .map((page) => entry(`/${page.slug}`, "weekly", 0.82))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const revenueResourceEntries = revenueGeoResources
    .map((page) => entry(`/resources/${page.slug}`, "weekly", 0.82))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const helpEntries = getHelpArticles()
    .map((page) => entry(`/help/${page.slug}`, "monthly", 0.75))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const learnEntries = getLearnArticles()
    .map((page) => entry(`/learn/${page.slug}`, "weekly", 0.8))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  return [
    ...staticEntries,
    ...chineseEntries,
    ...legacyEntries,
    ...programmaticEntries,
    ...revenueResourceEntries,
    ...helpEntries,
    ...learnEntries,
  ]
}
