import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  FileArchive,
  FileSpreadsheet,
  MessageSquareWarning,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { PrimaryCTA } from "@/components/marketing/MarketingActions"
import { JsonLd, PageHero, PageShell, Section, SectionHeader } from "@/components/marketing/MarketingPrimitives"
import { socialOpenGraphImage } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "8D Report Software for Customer-Ready Quality Reports",
  description:
    "Finish customer-ready 8D reports without rebuilding them in Excel. Capture D0-D8, evidence, review, and export PDF, Word, or Excel with attachments when present.",
  alternates: { canonical: "https://www.8d-reports.com" },
  openGraph: {
    title: "8D Report Software for Customer-Ready Quality Reports",
    description:
      "A lightweight 8D response and delivery workspace for quality engineers, SQEs, and small manufacturing quality teams.",
    url: "https://www.8d-reports.com",
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "8D Reports",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://www.8d-reports.com",
  description:
    "A lightweight 8D response and delivery workspace for customer-ready 8D reports, evidence, review, and PDF, Word, Excel exports.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan includes 3 lifetime reports.",
  },
}

const facts = [
  "Complete D0-D8 workflow",
  "Evidence and attachments",
  "PDF / Word / Excel exports",
  "Team approval, revisions, and activity history",
]

const workflow = [
  {
    icon: MessageSquareWarning,
    title: "Capture",
    text: "Open a response from a customer complaint, supplier issue, or recurring defect.",
  },
  {
    icon: ShieldCheck,
    title: "Investigate",
    text: "Work through D0-D8 with evidence, containment, root cause, action, and prevention.",
  },
  {
    icon: RefreshCw,
    title: "Review",
    text: "Use sharing, approval, locking, revisions, and activity history to control changes.",
  },
  {
    icon: PackageCheck,
    title: "Deliver",
    text: "Export the selected PDF, Word, or Excel format; when attachments exist, download them with that format as a ZIP.",
  },
]

const useCases = [
  "Customer complaints",
  "Supplier corrective actions / SCAR",
  "Internal recurring defects",
]

const plans = [
  {
    name: "Free",
    text: "3 lifetime reports, D0-D8 editor, attachments, view-only sharing, and watermarked PDF.",
  },
  {
    name: "Pro",
    text: "Unlimited personal reports, no-watermark PDF, Word and Excel export, logo, editable sharing, and history search.",
  },
  {
    name: "Team",
    text: "Team is for controlled review, approval, and delivery with 5 seats, shared workspace, roles, locking, revisions, and activity history.",
  },
]

const homeFaqs = [
  {
    question: "Can I start without a credit card?",
    answer: "Yes. Free includes 3 lifetime reports and does not require a credit card.",
  },
  {
    question: "Can I export Word and Excel?",
    answer:
      "Yes. Pro, Team, and single report export unlock Word and Excel along with no-watermark PDF.",
  },
  {
    question: "Can suppliers or customers review a report?",
    answer:
      "Yes. Free supports view-only sharing. Pro and Team can use editable sharing when collaboration is needed.",
  },
  {
    question: "Does AI approve reports?",
    answer:
      "No. AI Quality Check remains a beta assistant. Human reviewers remain responsible for approval.",
  },
]

function HeroProductPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="font-mono text-xs font-semibold text-indigo-600">
              8D-2026-014
            </p>
            <p className="text-sm font-semibold text-slate-950">
              Brake bracket coating failure
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Review
          </span>
        </div>
        <div className="grid min-h-[430px] grid-cols-[76px_1fr] sm:grid-cols-[108px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50 p-3">
            {["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"].map((step) => (
              <div
                key={step}
                className={
                  step === "D4"
                    ? "mb-1.5 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white"
                    : "mb-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500"
                }
              >
                {step}
              </div>
            ))}
          </aside>
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              D4 Root Cause
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Why did it occur, and why did it escape?
            </h2>
            <div className="mt-5 space-y-3">
              {[
                ["Occurrence cause", "Fixture cleaning check skipped before line change."],
                ["Escape cause", "Outgoing inspection did not check coating edge adhesion."],
                ["Evidence", "Salt spray photos, coating log, line-change record."],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["PDF", "Word", "Excel"].map((format) => (
                <div
                  key={format}
                  className="rounded-md bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700"
                >
                  {format}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <PageShell>
      <JsonLd data={productJsonLd} />
      <PageHero
        title="Finish customer-ready 8D reports without rebuilding them in Excel."
        description="Need to submit a customer-ready 8D or SCAR this week? Capture the issue, collect evidence, work through D0-D8, review changes, and export PDF, Word, or Excel with attachments when present."
        actions={
          <>
            <PrimaryCTA href="/signup" page="home" location="hero">
              Start free with 3 reports
            </PrimaryCTA>
            <PrimaryCTA
              href="/custom-8d-template-setup#request"
              page="home"
              location="hero"
              variant="secondary"
              eventData={{ service: "template_setup" }}
            >
              Upload your 8D template
            </PrimaryCTA>
            <PrimaryCTA
              href="/sample-report"
              page="home"
              location="hero"
              variant="ghost"
            >
              View complete example
            </PrimaryCTA>
          </>
        }
      >
        <HeroProductPreview />
        <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-950">
            Turn your Word / Excel 8D template into a reusable online workflow.
          </p>
          <p className="mt-1 text-sm leading-6 text-indigo-900">
            For teams that need customer-ready 8D/SCAR delivery before a full
            QMS rollout.
          </p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact} className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Check className="h-4 w-4 text-emerald-600" />
              {fact}
            </div>
          ))}
        </div>
      </PageHero>

      <Section id="workflow">
        <SectionHeader
          title="From complaint to deliverable"
          description="The product follows the path quality teams already work through, then keeps the deliverable tied to the source report."
        />
        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {workflow.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeader
            title="One report, not five disconnected files"
            description="Excel, Word, email, photos, and ZIP folders often drift apart. 8D Reports keeps the investigation, evidence, review state, exports, and reuse history together."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <FileSpreadsheet className="h-5 w-5 text-slate-500" />
              <h3 className="mt-4 font-semibold text-slate-950">Spreadsheet chaos</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Multiple copies, detached evidence, unclear review state, and
                manual reformatting before customer delivery.
              </p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-white p-5">
              <FileArchive className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 font-semibold text-slate-950">Controlled workspace</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Structured D0-D8 fields, attachments by step, sharing, exports,
                and searchable report history.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          title="Built for real quality work"
          description="Use it when a quality response needs to be complete enough for review and simple enough to finish without rebuilding documents."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {useCases.map((useCase) => (
            <article key={useCase} className="rounded-lg border border-slate-200 p-5">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {useCase}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Capture the issue, contain risk, verify cause, assign action,
                and preserve the final response for reuse.
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="border-b border-slate-200 pb-4">
              <p className="font-mono text-sm font-semibold text-indigo-600">
                Sample 8D Report
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Brake bracket coating failure
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p>
                D2: 18 of 500 brackets showed coating peel-off after salt spray
                validation.
              </p>
              <p>
                D4: Fixture cleaning check skipped before line change; escape
                control missed coating edge adhesion.
              </p>
              <p>
                D6: Three follow-up lots passed adhesion and visual checks.
              </p>
            </div>
          </div>
          <div>
            <SectionHeader
              title="See a finished report"
              description="Review the shape of a completed 8D response before you create your own."
            />
            <div className="mt-6">
              <PrimaryCTA
                href="/sample-report"
                page="home"
                location="sample_section"
                variant="secondary"
              >
                View complete example
              </PrimaryCTA>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            title="Plans for evaluation, delivery, and team control"
            description="Start free, then upgrade only when formal delivery or shared workflow control matters."
          />
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
          >
            Compare pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-lg border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-950">{plan.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{plan.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Start with one customer-ready report.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Free includes 3 lifetime reports, so your first useful test can be
              a real response instead of a blank template.
            </p>
            <div className="mt-7">
              <PrimaryCTA
                href="/signup"
                page="home"
                location="final_cta"
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                Start free with 3 reports
              </PrimaryCTA>
              <PrimaryCTA
                href="/custom-8d-template-setup#request"
                page="home"
                location="final_cta"
                variant="ghost"
                className="ml-0 mt-3 text-white hover:bg-white/10 hover:text-white sm:ml-3 sm:mt-0"
                eventData={{ service: "template_setup" }}
              >
                Request template setup
              </PrimaryCTA>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <h3 className="text-base font-semibold text-white">FAQ</h3>
            <div className="mt-4 space-y-4">
              {homeFaqs.map((faq) => (
                <div key={faq.question}>
                  <p className="text-sm font-semibold text-white">{faq.question}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  )
}
