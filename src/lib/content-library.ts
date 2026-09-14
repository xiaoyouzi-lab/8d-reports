import fs from "node:fs"
import path from "node:path"

import { slugify } from "./slugify"

export type ContentSection = {
  id: string
  title: string
}

export type ContentArticle = {
  slug: string
  title: string
  description: string
  type: string
  status: string
  canonicalUrl: string
  targetKeywords: string[]
  screenshots: string[]
  videos: string[]
  lastReviewed: string
  category?: string
  order?: number
  related?: string[]
  body: string
  sections: ContentSection[]
  sourcePath: string
}

// English remains the default locale so every existing caller keeps its
// behavior. Simplified Chinese articles live in sibling "-zh" directories.
export type ContentLocale = "en" | "zh"

const contentRoot = path.join(process.cwd(), "content")

const collectionDirectories: Record<"help" | "learn", Record<ContentLocale, string>> = {
  help: { en: "help", zh: "help-zh" },
  learn: { en: "learn", zh: "learn-zh" },
}

function parseValue(raw: string): string | string[] | number {
  const value = raw.trim()
  if (/^\d+$/.test(value)) return Number(value)
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item))
    } catch {
      return []
    }
  }
  return value.replace(/^["']|["']$/g, "")
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { data: {} as Record<string, string | string[] | number>, body: markdown.trim() }

  const data: Record<string, string | string[] | number> = {}
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":")
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    data[key] = parseValue(value)
  }

  return { data, body: markdown.slice(match[0].length).trim() }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function extractSections(body: string): ContentSection[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = line.replace(/^##\s+/, "").trim()
      return { id: slugify(title), title }
    })
}

function readCollection(collection: "help" | "learn", locale: ContentLocale) {
  const dir = path.join(contentRoot, collectionDirectories[collection][locale])
  if (!fs.existsSync(dir)) return []
  const prefix = locale === "zh" ? "zh/" : ""

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const sourcePath = path.join(dir, file)
      const markdown = fs.readFileSync(sourcePath, "utf8")
      const { data, body } = parseFrontmatter(markdown)
      const slug = String(data.slug || file.replace(/\.md$/, ""))

      return {
        slug,
        title: String(data.title || slug),
        description: String(data.description || ""),
        type: String(data.type || collection),
        status: String(data.status || "draft"),
        canonicalUrl: String(data.canonical_url || `/${prefix}${collection}/${slug}`),
        targetKeywords: toStringArray(data.target_keywords),
        screenshots: toStringArray(data.screenshots),
        videos: toStringArray(data.videos),
        lastReviewed: String(data.last_reviewed || ""),
        category: data.category ? String(data.category) : undefined,
        order: typeof data.order === "number" ? data.order : undefined,
        related: toStringArray(data.related),
        body,
        sections: extractSections(body),
        sourcePath,
      } satisfies ContentArticle
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title))
}

export function getHelpArticles(locale: ContentLocale = "en") {
  return readCollection("help", locale)
}

export function getHelpArticle(slug: string, locale: ContentLocale = "en") {
  return getHelpArticles(locale).find((article) => article.slug === slug)
}

export function getLearnArticles(locale: ContentLocale = "en") {
  return readCollection("learn", locale)
}

export function getLearnArticle(slug: string, locale: ContentLocale = "en") {
  return getLearnArticles(locale).find((article) => article.slug === slug)
}

export function getArticleByPath(pathname: string, locale: ContentLocale = "en") {
  const [collection, slug] = pathname.replace(/^\//, "").split("/")
  if (collection === "help") return getHelpArticle(slug, locale)
  if (collection === "learn") return getLearnArticle(slug, locale)
  return undefined
}
