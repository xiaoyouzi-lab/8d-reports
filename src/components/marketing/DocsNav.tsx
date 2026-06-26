"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import type { DocsTopic } from "@/lib/marketing-content"
import { cn } from "@/lib/utils"

export function DocsSidebar({ topics }: { topics: DocsTopic[] }) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-3">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Docs
        </p>
        <nav className="space-y-1">
          {topics.map((topic) => {
            const href = `/docs/${topic.slug}`
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

export function DocsTopicSelector({ topics }: { topics: DocsTopic[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const current = pathname.startsWith("/docs/")
    ? pathname.replace("/docs/", "")
    : ""

  return (
    <div className="lg:hidden">
      <label htmlFor="docs-topic" className="text-sm font-semibold text-slate-900">
        Docs topic
      </label>
      <select
        id="docs-topic"
        value={current}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
        onChange={(event) => {
          const slug = event.target.value
          const href = slug ? `/docs/${slug}` : "/docs"
          trackEvent("docs_topic_opened", {
            topic: slug || "index",
            destination: href,
          })
          router.push(href)
        }}
      >
        <option value="">Docs overview</option>
        {topics.map((topic) => (
          <option key={topic.slug} value={topic.slug}>
            {topic.title}
          </option>
        ))}
      </select>
    </div>
  )
}
