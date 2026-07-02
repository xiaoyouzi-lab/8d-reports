import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { getLearnArticles } from "@/lib/content-library"
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "Learn 8D Reports",
  description:
    "Educational articles about 8D reports, SCAR, Excel alternatives, AI-assisted drafting, supplier quality workflows, export, review, locking, and revision history.",
  alternates: { canonical: `${siteUrl}/learn` },
  openGraph: {
    title: "Learn 8D Reports",
    description:
      "Practical 8D and supplier quality education for quality engineers and manufacturing teams.",
    url: `${siteUrl}/learn`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "Learn", href: `${siteUrl}/learn` },
]

export default function LearnPage() {
  const articles = getLearnArticles()

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Learn practical 8D report workflows.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            SEO and product education articles for quality engineers, SQEs, and
            manufacturing teams. These articles support manual review and
            publishing workflows; they do not automate external posting.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <BookOpen className="h-4 w-4" />
                Learn article
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                {article.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                {article.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                Read article
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}
