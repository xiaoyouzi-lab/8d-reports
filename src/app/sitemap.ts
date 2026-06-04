import type { MetadataRoute } from "next"
import { seoPages as legacySeoPages } from "@/lib/seo-pages"
import { seoPages as programmaticSeoPages } from "@/content/seo-pages"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.8d-reports.com"
  const now = new Date()
  const seen = new Set<string>()

  function entry(
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
  ): MetadataRoute.Sitemap[number] | null {
    const url = path.startsWith("https://") ? path : `${baseUrl}${path}`
    if (seen.has(url)) return null
    seen.add(url)
    return { url, lastModified: now, changeFrequency, priority }
  }

  const staticEntries = [
    entry("/", "weekly", 1),
    entry("/sample-report", "weekly", 0.95),
    entry("/resources", "weekly", 0.9),
    entry("/pricing", "weekly", 0.9),
    entry("/custom-8d-template-setup", "monthly", 0.8),
    entry("/team-launch", "monthly", 0.8),
    entry("/demo-reports", "weekly", 0.85),
    entry("/demo-reports/automotive", "monthly", 0.8),
    entry("/demo-reports/molding", "monthly", 0.8),
    entry("/demo-reports/electronics", "monthly", 0.8),
    entry("/8d-report-review-service", "monthly", 0.75),
    entry("/security", "monthly", 0.6),
    entry("/faq", "monthly", 0.75),
    entry("/docs", "monthly", 0.75),
    entry("/contact", "monthly", 0.45),
    entry("/signup", "monthly", 0.8),
    entry("/login", "monthly", 0.5),
    entry("/privacy", "monthly", 0.3),
    entry("/terms", "monthly", 0.3),
  ].filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item))

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
