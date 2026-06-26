import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DocsSidebar, DocsTopicSelector } from "@/components/marketing/DocsNav"
import { PrimaryCTA } from "@/components/marketing/MarketingActions"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { docsTopics, siteUrl, socialOpenGraphImage } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "Product Docs: Reports, Exports, and Sharing",
  description:
    "Learn how to create reports, edit D0-D8, manage attachments, export PDF Word or Excel, package attachments when present, share reports, use Team, and review AI Quality Check.",
  alternates: { canonical: `${siteUrl}/docs` },
  openGraph: {
    title: "Product Docs: Reports, Exports, and Sharing",
    description:
      "Practical product docs for creating, editing, exporting, sharing, and reviewing 8D reports.",
    url: `${siteUrl}/docs`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "Docs", href: `${siteUrl}/docs` },
]

export default function DocsPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Product docs for finishing customer-ready 8D reports.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Short operating guides for creating a report, editing D0-D8,
            attaching evidence, exporting PDF / Word / Excel, packaging
            attachments when present, sharing, Team workflow, billing,
            security, and AI Quality Check.
          </p>
          <div className="mt-8">
            <PrimaryCTA href="/docs/getting-started" page="docs" location="hero">
              Start with getting started
            </PrimaryCTA>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[260px_1fr]">
          <DocsSidebar topics={docsTopics} />
          <div>
            <DocsTopicSelector topics={docsTopics} />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:mt-0">
              {docsTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/docs/${topic.slug}`}
                  className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <h2 className="text-base font-semibold text-slate-950">
                    {topic.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {topic.summary}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                    Read topic
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
