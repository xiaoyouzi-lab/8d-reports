import type { Metadata } from "next"
import {
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FileType,
} from "lucide-react"
import { CopyTemplateButton, PrimaryCTA } from "@/components/marketing/MarketingActions"
import { FaqAccordion, StepAccordion } from "@/components/marketing/FaqAccordion"
import {
  Breadcrumbs,
  JsonLd,
  PageHero,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import {
  blankTemplateText,
  socialOpenGraphImage,
  siteUrl,
  templateSteps,
  type SimpleFaq,
} from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "8D Report Template | D0-D8 Online Form and Copyable Template",
  description:
    "Use an action-first 8D report template with a copyable blank structure, D0-D8 guidance, common mistakes, Word Excel PDF comparison, and FAQ.",
  alternates: { canonical: `${siteUrl}/8d-report-template` },
  openGraph: {
    title: "8D Report Template",
    description:
      "A practical D0-D8 template for quality engineers who need customer-ready 8D reports without rebuilding them in Excel.",
    url: `${siteUrl}/8d-report-template`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "8D template", href: `${siteUrl}/8d-report-template` },
]

const commonMistakes = [
  "Writing a broad D2 symptom without quantity, location, timing, or specification evidence.",
  "Calling sorting or rework a permanent corrective action instead of temporary containment.",
  "Stopping a 5 Why at an operator action without verifying the process or system cause.",
  "Listing D5 actions that cannot be traced back to the verified occurrence and escape causes.",
  "Closing D6 without an effectiveness check, sample size, result, or monitoring period.",
]

const formatGuidance = [
  {
    icon: FileText,
    format: "PDF",
    bestFor: "Fixed customer submission or controlled final record.",
    note: "Use no-watermark PDF for formal delivery when the report is complete.",
  },
  {
    icon: FileType,
    format: "Word",
    bestFor: "A customer or supplier requires an editable document.",
    note: "Keep the online report as the source of truth so copies do not drift.",
  },
  {
    icon: FileSpreadsheet,
    format: "Excel",
    bestFor: "The recipient expects tabular actions, owners, and due dates.",
    note: "Use it for structured review while preserving evidence in the report.",
  },
]

const faqs: SimpleFaq[] = [
  {
    question: "What is an 8D report template?",
    answer:
      "An 8D report template is a structured corrective action format that guides a team from preparation and containment through root cause, permanent action, verification, prevention, and closure.",
  },
  {
    question: "Does an 8D template start at D0 or D1?",
    answer:
      "Many organizations use D0 as a preparation step before the formal D1-D8 sequence. Including D0 helps document scope, urgency, and the decision to open an 8D.",
  },
  {
    question: "Can I use this template for a supplier corrective action request?",
    answer:
      "Yes. The structure works for supplier 8D responses, SCARs, customer complaints, recurring manufacturing defects, and other evidence-based corrective action investigations.",
  },
  {
    question: "Should I use Word, Excel, or PDF?",
    answer:
      "Use the format required by the recipient. PDF is best for fixed delivery, Word for editable narrative, and Excel for tabular customer formats.",
  },
  {
    question: "Can I create an 8D report online for free?",
    answer:
      "Yes. Free includes 3 lifetime reports, the complete D0-D8 editor, attachments, view-only sharing, and watermarked PDF export.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

export default function EightDReportTemplatePage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <PageHero
        title="8D report template for customer-ready corrective action responses."
        description="Use a structured D0-D8 workflow online, copy a blank outline when needed, and export the finished response in the format your customer requires."
        actions={
          <>
            <PrimaryCTA href="/signup" page="8d_report_template" location="hero">
              Use online template
            </PrimaryCTA>
            <CopyTemplateButton
              text={blankTemplateText}
              page="8d_report_template"
              location="hero"
            />
            <PrimaryCTA
              href="/sample-report"
              page="8d_report_template"
              location="hero"
              variant="ghost"
            >
              View completed example
            </PrimaryCTA>
          </>
        }
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              Blank report structure
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              D0-D8 prompts are ready for problem description, containment,
              root cause, corrective action, validation, prevention, and closure.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["D2 facts", "D4 causes", "D6 validation"].map((item) => (
                <div key={item} className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageHero>

      <Section>
        <SectionHeader
          title="Copyable blank template"
          description="Use this when you need a plain structure, then move the working report online when evidence, sharing, and export control matter."
        />
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-950 p-5">
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-100">
            {blankTemplateText}
          </pre>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="D0-D8 guidance"
          description="Open the steps you need. D2, D4, and D5 are expanded first because they carry the core quality logic."
        />
        <div className="mt-8">
          <StepAccordion
            items={templateSteps}
            defaultOpen={["D2", "D4", "D5"]}
            page="8d_report_template"
          />
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="Common mistakes"
            description="Most weak 8D reports fail because the logic is incomplete, not because the template is missing a field."
          />
          <div className="space-y-3">
            {commonMistakes.map((mistake) => (
              <div key={mistake} className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm leading-6 text-slate-700">{mistake}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="Word, Excel, or PDF?"
          description="Pick the format the recipient needs, but keep the report and evidence controlled before export."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {formatGuidance.map((item) => (
            <article key={item.format} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {item.format}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.bestFor}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">{item.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            title="Template FAQ"
            description="Short answers for teams choosing a practical 8D format."
          />
          <FaqAccordion
            groups={[{ title: "8D template", items: faqs }]}
            page="8d_report_template"
          />
        </div>
      </Section>

      <Section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to use the template online?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Start free with the complete D0-D8 editor, attachments, sharing,
              and watermarked PDF export.
            </p>
          </div>
          <PrimaryCTA
            href="/signup"
            page="8d_report_template"
            location="final_cta"
            className="bg-white text-slate-950 hover:bg-slate-100"
          >
            Use online template
          </PrimaryCTA>
        </div>
      </Section>
    </PageShell>
  )
}
