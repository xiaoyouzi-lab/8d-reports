import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  ListChecks,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "8D Report Template: D0-D8 Guide and Online Form",
  description:
    "Use a practical 8D report template with D0-D8 guidance, common-error checks, format advice, and an online workflow for PDF, Word, or Excel export.",
  alternates: { canonical: "https://www.8d-reports.com/8d-report-template" },
  openGraph: {
    title: "8D Report Template: D0-D8 Guide and Online Form",
    description:
      "A quality-engineer-ready 8D template with D0-D8 prompts, common mistakes, format guidance, and sample report links.",
    url: "https://www.8d-reports.com/8d-report-template",
    type: "website",
  },
}

const templateSteps = [
  {
    step: "D0",
    title: "Plan and prepare",
    purpose: "Confirm the issue needs an 8D and define the immediate response scope.",
    prompt: "Customer, product, batch, symptom, urgency, affected quantity, and initial owner.",
  },
  {
    step: "D1",
    title: "Build the team",
    purpose: "Assign the people who understand the product, process, detection controls, and customer impact.",
    prompt: "Team members, functions, responsibilities, leader, and escalation contacts.",
  },
  {
    step: "D2",
    title: "Describe the problem",
    purpose: "Turn the complaint into a measurable problem statement instead of a general symptom.",
    prompt: "What, where, when, who, how many, frequency, specification, and Is / Is Not boundaries.",
  },
  {
    step: "D3",
    title: "Contain the issue",
    purpose: "Protect the customer while the permanent cause and corrective action are still being verified.",
    prompt: "Sort scope, stock locations, suspect dates, responsible owner, verification result, and release criteria.",
  },
  {
    step: "D4",
    title: "Verify root cause",
    purpose: "Identify why the defect occurred and why the existing controls allowed it to escape.",
    prompt: "Occurrence cause, escape cause, system cause, 5-Why or fishbone evidence, and verification method.",
  },
  {
    step: "D5",
    title: "Choose corrective actions",
    purpose: "Select actions that address the verified causes without creating unacceptable new risks.",
    prompt: "Action, linked cause, owner, due date, expected result, risk review, and approval.",
  },
  {
    step: "D6",
    title: "Implement and validate",
    purpose: "Show that the permanent actions were completed and were effective under real conditions.",
    prompt: "Implementation date, changed process or control, validation sample, result, and remaining risk.",
  },
  {
    step: "D7",
    title: "Prevent recurrence",
    purpose: "Extend the learning to similar products, processes, documents, controls, and teams.",
    prompt: "Control plan, PFMEA, work instruction, training, audit, horizontal deployment, and owner.",
  },
  {
    step: "D8",
    title: "Close and recognize",
    purpose: "Confirm customer acceptance, close open actions, and preserve lessons for future reports.",
    prompt: "Closure evidence, customer response, final approver, lessons learned, and team recognition.",
  },
]

const commonMistakes = [
  "Writing a broad D2 symptom without quantity, location, timing, or specification evidence.",
  "Calling sorting or rework a permanent corrective action instead of temporary containment.",
  "Stopping a 5-Why at an operator action without verifying the process or system cause.",
  "Listing D5 actions that cannot be traced back to the verified occurrence and escape causes.",
  "Closing D6 without an effectiveness check, sample size, result, or monitoring period.",
  "Repeating the same action in D7 instead of updating controls, standards, training, or similar processes.",
]

const formatGuidance = [
  {
    format: "Word",
    bestFor: "A customer or supplier requires an editable formal document.",
    watchFor: "Manual copies can drift from the current report and attachment set.",
  },
  {
    format: "Excel",
    bestFor: "The recipient expects tabular actions, owners, dates, or a company spreadsheet format.",
    watchFor: "Long problem-solving logic and evidence references can become hard to review.",
  },
  {
    format: "PDF",
    bestFor: "A fixed, review-ready submission or controlled customer record.",
    watchFor: "Use it as the final deliverable, not the collaborative source of truth.",
  },
]

const faqs = [
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
    question: "Should I use Word, Excel, or PDF for an 8D report?",
    answer:
      "Use the format required by the recipient. Word is useful for editable narrative, Excel for tabular customer formats, and PDF for a fixed final submission. An online source helps keep evidence and revisions together before export.",
  },
  {
    question: "What is the difference between containment and corrective action?",
    answer:
      "Containment protects the customer immediately while investigation continues. Corrective action changes the verified cause so the problem is less likely to happen or escape again.",
  },
  {
    question: "Can I create an 8D report online for free?",
    answer:
      "Yes. 8D Reports includes 3 lifetime reports on Free, the complete D0-D8 editor, attachments, view-only sharing, and watermarked PDF export.",
  },
]

const copyableTemplate = templateSteps
  .map(({ step, title, prompt }) => `${step} - ${title}\n${prompt}\n`)
  .join("\n")

const faqSchema = {
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
    <div className="bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-600">
              Practical 8D report template
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">
              8D report template with a usable D0-D8 structure
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Use this template to document customer complaints, supplier
              issues, containment, verified root causes, corrective actions,
              and prevention. Create it online, attach evidence, then export a
              customer-ready PDF, Word, or Excel report.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                )}
              >
                Create a free 8D report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sample-report"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-slate-300 px-6"
                )}
              >
                View sample 8D report
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Template outline</p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  Customer complaint / supplier 8D
                </p>
              </div>
              <ListChecks className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {templateSteps.map((item) => (
                <div key={item.step} className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="font-mono text-sm font-semibold text-indigo-700">{item.step}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">
              What an 8D report template should do
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A useful template does more than provide headings. It keeps the
              problem statement, immediate protection, cause evidence, actions,
              validation, and prevention connected so a customer or supplier
              reviewer can follow the reasoning.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Define", "Turn the complaint into a measurable problem and affected scope."],
              ["Verify", "Separate occurrence, escape, and system causes and support them with evidence."],
              ["Deliver", "Keep actions, attachments, revisions, and export-ready output together."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-lg border border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-950">
              D0-D8 template: what to enter at every stage
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Use each prompt as a minimum review checklist. Add measurements,
              photos, inspection records, tests, approvals, and customer
              evidence where the investigation requires them.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templateSteps.map((item) => (
              <article key={item.step} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-indigo-50 px-2.5 py-1 font-mono text-sm font-semibold text-indigo-700">
                    {item.step}
                  </span>
                  <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{item.purpose}</p>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                  Include: {item.prompt}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">
              Copyable blank 8D structure
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Copy these headings into a customer form, internal document, or
              investigation brief. Keep the online report as the working source
              when several people need to add evidence or review changes.
            </p>
          </div>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-100">
            {copyableTemplate}
          </pre>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-950">
              Common 8D template mistakes
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Review these points before sending the report to a customer,
              supplier quality engineer, or internal approver.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {commonMistakes.map((mistake) => (
              <div key={mistake} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-5">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm leading-6 text-slate-700">{mistake}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <h2 className="text-3xl font-semibold text-slate-950">
                When to use Word, Excel, or PDF
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The recipient may control the final format. Build the report
                around verified evidence first, then export the version that
                fits the customer or supplier workflow.
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[0.35fr_1fr_1fr] bg-slate-950 px-4 py-3 text-xs font-semibold text-white">
                <span>Format</span>
                <span>Best used when</span>
                <span>Watch for</span>
              </div>
              {formatGuidance.map((item) => (
                <div key={item.format} className="grid grid-cols-[0.35fr_1fr_1fr] gap-3 border-t border-slate-200 px-4 py-4 text-sm leading-6">
                  <span className="font-semibold text-slate-950">{item.format}</span>
                  <span className="text-slate-700">{item.bestFor}</span>
                  <span className="text-slate-500">{item.watchFor}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-lg border border-slate-200 p-5">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <p className="text-sm leading-6 text-slate-700">
                PDF is available for fixed delivery; Free exports include a watermark.
              </p>
            </div>
            <div className="flex gap-3 rounded-lg border border-slate-200 p-5">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-6 text-slate-700">
                Word and Excel exports support editable or tabular handoffs when plan access allows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-indigo-100 bg-indigo-50/60 py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Turn the template into a working report
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Start with 3 free reports, keep attachments beside the relevant
              D-step, and compare the structure with a completed sample before
              customer submission.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 shrink-0 bg-indigo-600 px-6 hover:bg-indigo-700"
              )}
            >
              Create a free 8D report
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sample-report"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 shrink-0 border-indigo-200 bg-white px-6"
              )}
            >
              View sample 8D report
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold text-slate-950">
            8D report template FAQ
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
