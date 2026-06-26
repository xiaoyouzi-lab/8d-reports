import type { Metadata } from "next"
import { PrimaryCTA } from "@/components/marketing/MarketingActions"
import { FaqAccordion } from "@/components/marketing/FaqAccordion"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { allFaqs, faqGroups, siteUrl, socialOpenGraphImage } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "FAQ: Plans, Exports, Sharing, Security, and AI",
  description:
    "Answers about free reports, billing, PDF Word Excel export, attachments, sharing, Team workflow, security, and AI Quality Check.",
  alternates: { canonical: `${siteUrl}/faq` },
  openGraph: {
    title: "FAQ: Plans, Exports, Sharing, Security, and AI",
    description:
      "Plans, exports, sharing, Team workflow, security, and AI answers for 8D Reports.",
    url: `${siteUrl}/faq`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "FAQ", href: `${siteUrl}/faq` },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

export default function FaqPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Practical answers about starting free, exporting formal deliverables,
            sharing reports, team workflow, data handling, and AI Quality Check.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCTA href="/signup" page="faq" location="hero">
              Start free with 3 reports
            </PrimaryCTA>
            <PrimaryCTA href="/docs" page="faq" location="hero" variant="secondary">
              Read docs
            </PrimaryCTA>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            title="Answers by topic"
            description="Open the category that matches the decision you are trying to make."
          />
          <FaqAccordion groups={faqGroups} />
        </div>
      </Section>
    </PageShell>
  )
}
