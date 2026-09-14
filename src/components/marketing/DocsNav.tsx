"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import type { DocsTopic } from "@/lib/marketing-content"
import { cn } from "@/lib/utils"

export function DocsSidebar({
  topics,
  label = "Docs",
}: {
  topics: DocsTopic[]
  label?: string
}) {
  const pathname = usePathname()
  // The sidebar is shared by the English and Chinese docs routes. Deriving the
  // prefix from the current path keeps Chinese readers on /zh/docs/*.
  const base = pathname.startsWith("/zh") ? "/zh/docs" : "/docs"

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-3">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <nav className="space-y-1">
          {topics.map((topic) => {
            const href = `${base}/${topic.slug}`
            const active = pathname === href

            return (
              <Link
                key={topic.slug}
                href={href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
                onClick={() =>
                  trackEvent("docs_topic_opened", {
                    topic: topic.slug,
                    destination: href,
                  })
                }
              >
                {topic.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export function DocsTopicSelector({
  topics,
  label = "Docs topic",
  overviewLabel = "Docs overview",
}: {
  topics: DocsTopic[]
  label?: string
  overviewLabel?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const base = pathname.startsWith("/zh") ? "/zh/docs" : "/docs"
  const current = pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length + 1)
    : ""

  return (
    <div className="lg:hidden">
      <label htmlFor="docs-topic" className="text-sm font-semibold text-slate-900">
        {label}
      </label>
      <select
        id="docs-topic"
        value={current}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
        onChange={(event) => {
          const slug = event.target.value
          const href = slug ? `${base}/${slug}` : base
          trackEvent("docs_topic_opened", {
            topic: slug || "index",
            destination: href,
          })
          router.push(href)
        }}
      >
        <option value="">{overviewLabel}</option>
        {topics.map((topic) => (
          <option key={topic.slug} value={topic.slug}>
            {topic.title}
          </option>
        ))}
      </select>
    </div>
  )
}
