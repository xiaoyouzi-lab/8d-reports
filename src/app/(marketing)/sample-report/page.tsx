import type { Metadata } from "next"
import Link from "next/link"
import { Download, FileArchive, FileText, ImageIcon, ShieldCheck } from "lucide-react"
import { PrimaryCTA, TrackedLink } from "@/components/marketing/MarketingActions"
import { StepAccordion } from "@/components/marketing/FaqAccordion"
import {
  Breadcrumbs,
  JsonLd,
  PageHero,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { buttonVariants } from "@/components/ui/button"
import { sampleReportSteps, siteUrl } from "@/lib/marketing-content"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Complete 8D Example Report | 8D Reports",
  description:
    "See a complete 8D example from containment to verified corrective action, with evidence, export package, and related industry examples.",
  alternates: { canonical: `${siteUrl}/sample-report` },
  openGraph: {
    title: "Complete 8D Example Report",
    description:
      "Review a finished D0-D8 report example before creating your own customer-ready 8D response.",
    url: `${siteUrl}/sample-report`,
    type: "website",
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "Sample report", href: `${siteUrl}/sample-report` },
]

const evidenceItems = [
  {
    icon: ImageIcon,
    title: "Photos and inspection records",
    text: "Evidence is tied to the step it supports so reviewers can see why decisions were made.",
  },
  {
    icon: FileText,
    title: "PDF, Word, and Excel outputs",
    text: "Formal delivery can match the recipient format without rewriting the report.",
  },
  {
    icon: FileArchive,
    title: "Attachment package",
    text: "When attachments are present, the export package can include report files and evidence together.",
  },
]

const credibilityChecks = [
  "D2 includes quantity, date, product, customer context, and affected scope.",
  "D3 containment is separate from permanent corrective action.",
  "D4 separates occurrence cause from escape cause.",
  "D5 actions trace back to the verified causes.",
  "D6 includes effectiveness evidence and sample size.",
]

const relatedExamples = [
  { label: "Automotive 8D example", href: "/8d-report-example/automotive" },
  { label: "Supplier 8D example", href: "/8d-report-example/supplier-quality" },
  { label: "Customer complaint 8D", href: "/8d-report-example/customer-complaint" },
]

export default function SampleReportPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <PageHero
        title="A complete 8D example — from containment to verified corrective action."
        description="Use this sample to see how a finished report connects the customer issue, evidence, D0-D8 reasoning, review state, and export package."
        actions={
          <>
            <PrimaryCTA href="/signup" page="sample_report" location="hero">
              Use this structure
            </PrimaryCTA>
            <TrackedLink
              href="/api/sample-reports/automotive"
              rel="nofollow"
              eventName="sample_download"
              eventData={{ page: "sample_report", format: "pdf" }}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50",
              )}
            >
              Download sample PDF
              <Download className="h-4 w-4" />
            </TrackedLink>
            <PrimaryCTA
              href="/resources"
              page="sample_report"
              location="hero"
              variant="ghost"
            >
              Browse industry examples
            </PrimaryCTA>
          </>
        }
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="font-mono text-sm font-semibold text-indigo-600">
                  2026-05-18-001
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Brake bracket coating failure
                </h2>
              </div>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Completed
              </span>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Customer", "Northline Motors"],
                ["Affected scope", "18 / 500 pcs"],
                ["Owner", "Quality engineering"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              The report shows a controlled response: immediate containment,
              verified fixture-cleaning cause, checklist update, retraining, and
              three clean follow-up lots.
            </p>
          </div>
        </div>
      </PageHero>

      <Section>
        <SectionHeader
          title="Browse the D0-D8 report"
          description="The most important proof steps are open by default. You can expand the rest without reading the same content twice."
        />
        <div className="mt-8">
          <StepAccordion
            items={sampleReportSteps}
            defaultOpen={["D2", "D4", "D5"]}
            page="sample_report"
          />
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="Evidence and export package"
          description="A complete response is more than D0-D8 text. The final deliverable should carry the evidence needed for customer review."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {evidenceItems.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="What makes this report credible"
            description="A customer-ready 8D report shows how the facts, causes, actions, and verification fit together."
          />
          <ul className="space-y-3">
            {credibilityChecks.map((check) => (
              <li key={check} className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm leading-6 text-slate-700">{check}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            title="Related industry examples"
            description="Use these examples when the issue type or customer context is closer to your own report."
          />
          <Link
            href="/resources"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
          >
            Browse all resources
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {relatedExamples.map((example) => (
            <Link
              key={example.href}
              href={example.href}
              className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Complete example
              </p>
              <h3 className="mt-3 text-base font-semibold text-slate-950">
                {example.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review a practical D0-D8 response for a related quality scenario.
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-950 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to structure your own 8D response?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Start from the same D0-D8 workflow and export when your report is
              ready for customer delivery.
            </p>
          </div>
          <PrimaryCTA
            href="/signup"
            page="sample_report"
            location="final_cta"
            className="bg-white text-slate-950 hover:bg-slate-100"
          >
            Start free with 3 reports
          </PrimaryCTA>
        </div>
      </Section>
    </PageShell>
  )
}
