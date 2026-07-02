import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { getHelpArticles } from "@/lib/content-library"
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Practical Help Center for 8D Reports modules, D0-D8 editing, AI Draft, AI Quality Check, evidence, workflow, sharing, export, pricing, and troubleshooting.",
  alternates: { canonical: `${siteUrl}/help` },
  openGraph: {
    title: "8D Reports Help Center",
    description:
      "Product help for creating, reviewing, sharing, and exporting customer-ready 8D reports.",
    url: `${siteUrl}/help`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "Help", href: `${siteUrl}/help` },
]

export default function HelpPage() {
  const articles = getHelpArticles()
  const categories = Array.from(new Set(articles.map((article) => article.category || "Help")))

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Help Center for 8D Reports.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Module-by-module guidance for creating reports, completing D0-D8,
            using AI assistance conservatively, managing evidence, reviewing
            workflow state, sharing, exporting, and troubleshooting.
          </p>
          <div className="mt-8 max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3">
              <Search className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <p className="text-sm leading-6 text-slate-700">
                Use your browser find command on this page, or open an article
                for a page-level table of contents.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-3">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Help groups
              </p>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <a
                    key={category}
                    href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  >
                    {category}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-10">
            {categories.map((category) => {
              const items = articles.filter((article) => (article.category || "Help") === category)
              return (
                <section
                  key={category}
                  id={category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {category}
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {items.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/help/${article.slug}`}
                        className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <h3 className="text-base font-semibold text-slate-950">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {article.description}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                          Read help
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </Section>
    </PageShell>
  )
}
