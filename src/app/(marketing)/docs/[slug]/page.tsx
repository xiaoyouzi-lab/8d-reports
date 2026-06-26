import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react"
import { DocsSidebar, DocsTopicSelector } from "@/components/marketing/DocsNav"
import { PrimaryCTA } from "@/components/marketing/MarketingActions"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { docsTopicUrl, docsTopics, getDocsTopic, siteUrl } from "@/lib/marketing-content"

export const dynamicParams = false

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return docsTopics.map((topic) => ({ slug: topic.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const topic = getDocsTopic(slug)
  if (!topic) return {}

  return {
    title: `${topic.title} | 8D Reports Docs`,
    description: topic.summary,
    alternates: { canonical: docsTopicUrl(topic.slug) },
    openGraph: {
      title: `${topic.title} | 8D Reports Docs`,
      description: topic.summary,
      url: docsTopicUrl(topic.slug),
      type: "article",
    },
  }
}

export default async function DocsTopicPage({ params }: Props) {
  const { slug } = await params
  const topic = getDocsTopic(slug)
  if (!topic) notFound()

  const index = docsTopics.findIndex((item) => item.slug === topic.slug)
  const previous = docsTopics[index - 1]
  const next = docsTopics[index + 1]
  const breadcrumbItems = [
    { label: "Home", href: siteUrl },
    { label: "Docs", href: `${siteUrl}/docs` },
    { label: topic.title, href: docsTopicUrl(topic.slug) },
  ]

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {topic.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {topic.summary}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[260px_1fr]">
          <DocsSidebar topics={docsTopics} />
          <article className="min-w-0">
            <DocsTopicSelector topics={docsTopics} />
            <div className="mt-8 lg:mt-0">
              <h2 className="text-xl font-semibold text-slate-950">Steps</h2>
              <ol className="mt-5 space-y-4">
                {topic.steps.map((step, stepIndex) => (
                  <li key={step} className="grid gap-3 sm:grid-cols-[44px_1fr]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 font-mono text-sm font-semibold text-indigo-700">
                      {stepIndex + 1}
                    </span>
                    <p className="text-base leading-7 text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-lg border border-indigo-100 bg-indigo-50 p-5">
                <div className="flex gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
                  <div>
                    <h2 className="text-base font-semibold text-indigo-950">
                      Note
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-indigo-900">
                      {topic.callout}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {previous ? (
                  <Link
                    href={`/docs/${previous.slug}`}
                    className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous
                    </span>
                    <p className="mt-2 font-semibold text-slate-950">
                      {previous.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {next ? (
                  <Link
                    href={`/docs/${next.slug}`}
                    className="rounded-lg border border-slate-200 p-5 text-right transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Next
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 font-semibold text-slate-950">
                      {next.title}
                    </p>
                  </Link>
                ) : null}
              </div>

              <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  Still need help?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Send the context of the report, export, sharing, or billing
                  question and we will help you choose the safest next step.
                </p>
                <div className="mt-5">
                  <PrimaryCTA
                    href="/contact"
                    page="docs"
                    location={`topic_${topic.slug}_help`}
                    variant="secondary"
                  >
                    Contact support
                  </PrimaryCTA>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  )
}
