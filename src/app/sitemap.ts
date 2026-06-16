import type { MetadataRoute } from "next"
import { seoPages as legacySeoPages } from "@/lib/seo-pages"
import { seoPages as programmaticSeoPages } from "@/content/seo-pages"
import { INDEXABLE_STATIC_PATHS, SITE_URL } from "@/lib/seo-index-hygiene"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const seen = new Set<string>()

  function entry(
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
  ): MetadataRoute.Sitemap[number] | null {
    const url = path.startsWith("https://") ? path : `${SITE_URL}${path === "/" ? "" : path}`
    if (seen.has(url)) return null
    seen.add(url)
    return { url, lastModified: now, changeFrequency, priority }
  }

  const staticEntries = INDEXABLE_STATIC_PATHS
    .map((path) => entry(path, path === "/" ? "weekly" : "monthly", path === "/" ? 1 : 0.8))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const legacyEntries = legacySeoPages
    .map((page) => entry(`/${page.slug}`, "weekly", 0.85))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  const programmaticEntries = programmaticSeoPages
    .map((page) => entry(`/${page.slug}`, "weekly", 0.82))
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

  return [
    ...staticEntries,
    ...legacyEntries,
    ...programmaticEntries,
  ]
}
