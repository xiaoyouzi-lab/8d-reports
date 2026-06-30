"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { PrimaryCTA, TrackedLink } from "@/components/marketing/MarketingActions"
import { trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

export type ResourceCardData = {
  href: string
  title: string
  description: string
  category: string
  categoryKey: string
}

const filters = [
  { label: "All", key: "all" },
  { label: "8D Templates", key: "8d-template" },
  { label: "Complete Examples", key: "8d-example" },
  { label: "Root Cause Tools", key: "root-cause" },
  { label: "Corrective Actions", key: "corrective-action" },
  { label: "Preventive Actions", key: "preventive-action" },
  { label: "Revenue Guides", key: "revenue-geo" },
]

function matchesFilter(resource: ResourceCardData, filter: string) {
  if (filter === "all") return true
  if (filter === "root-cause") return resource.categoryKey === "5why-example" || resource.categoryKey === "fishbone-example"
  return resource.categoryKey === filter
}

export function ResourcesExplorer({
  featured,
  resources,
}: {
  featured: ResourceCardData[]
  resources: ResourceCardData[]
}) {
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(12)

  const visibleResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return resources.filter((resource) => {
      const matchesQuery =
        !normalizedQuery ||
        resource.title.toLowerCase().includes(normalizedQuery) ||
        resource.description.toLowerCase().includes(normalizedQuery) ||
        resource.category.toLowerCase().includes(normalizedQuery)
      return matchesFilter(resource, filter) && matchesQuery
    })
  }, [filter, query, resources])

  const displayed = visibleResources.slice(0, visibleCount)

  return (
    <div className="space-y-14">
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Featured resources
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Start with the templates, examples, and root-cause tools most
              useful when a customer or supplier asks for an 8D response.
            </p>
          </div>
          <PrimaryCTA
            href="/sample-report"
            page="resources"
            location="featured_header"
            variant="ghost"
          >
            View complete example
          </PrimaryCTA>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((resource) => (
            <ResourceCard key={resource.href} resource={resource} featured />
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setVisibleCount(12)
                }}
                aria-label="Search resources"
                placeholder="Search templates, examples, and tools"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  className={cn(
                    "rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                    filter === item.key
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700",
                  )}
                  onClick={() => {
                    setFilter(item.key)
                    setVisibleCount(12)
                    trackEvent("resource_filter_used", {
                      filter: item.key,
                      page: "resources",
                    })
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map((resource) => (
            <ResourceCard key={resource.href} resource={resource} />
          ))}
        </div>

        {visibleResources.length > visibleCount ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              onClick={() => setVisibleCount((count) => count + 12)}
            >
              Load more
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export function ResourceCard({
  resource,
  featured = false,
}: {
  resource: ResourceCardData
  featured?: boolean
}) {
  return (
    <article
      className={cn(
        "flex min-h-[220px] flex-col rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30",
        featured ? "border-indigo-100" : "",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
        {resource.category}
      </p>
      <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">
        {resource.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
        {resource.description}
      </p>
      <TrackedLink
        href={resource.href}
        eventName="resource_opened"
        eventData={{
          page: "resources",
          category: resource.categoryKey,
          title: resource.title,
        }}
        className="mt-auto inline-flex pt-5 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
      >
        View resource
      </TrackedLink>
    </article>
  )
}
