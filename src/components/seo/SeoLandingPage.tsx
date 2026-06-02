import Link from "next/link";
import { ClipboardCheck, FileText, Paperclip, Search, ShieldCheck } from "lucide-react";
import type { SeoPage } from "@/content/seo-pages";
import { getRelatedSeoPages } from "@/content/seo-pages";
import { SeoPageViewTracker, SeoPrimaryCta, SeoTemplateCta } from "./SeoTracking";

const baseUrl = "https://www.8d-reports.com";

function displayPath(slug: string) {
  return `/${slug}`;
}

function pageTypeLabel(page: SeoPage) {
  switch (page.type) {
    case "8d-example":
      return "complete 8D example";
    case "8d-template":
      return "template guidance";
    case "5why-example":
      return "5 Why chain";
    case "fishbone-example":
      return "fishbone analysis";
    case "corrective-action":
      return "corrective action plan";
    case "preventive-action":
      return "preventive action plan";
  }
}

function buildJsonLd(page: SeoPage) {
  const pageUrl = `${baseUrl}/${page.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: page.h1,
        description: page.metaDescription,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "8D Reports",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "8D Reports",
          url: baseUrl,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

function evidenceForStep(page: SeoPage, step: string) {
  switch (step) {
    case "D0":
      return `case opening record, scope list, ${page.professional.affectedScope}`;
    case "D1":
      return "team roster, roles, contact list, reviewer assignment";
    case "D2":
      return `${page.professional.detection}; quantified as ${page.professional.metric}`;
    case "D3":
      return "containment log, blocked stock list, sort record, customer notice";
    case "D4":
      return `5 Why, fishbone, process evidence, escape point: ${page.professional.escapePoint}`;
    case "D5":
      return "approved action plan, updated procedure, release-gate change";
    case "D6":
      return page.professional.verification;
    case "D7":
      return "control-plan update, layered audit, lessons learned, recurrence monitor";
    case "D8":
      return "closure approval, customer acceptance, final exported report package";
    default:
      return "step-specific supporting evidence";
  }
}

function ownerForStep(step: string) {
  switch (step) {
    case "D0":
    case "D2":
    case "D8":
      return "Quality engineer";
    case "D1":
      return "Quality manager";
    case "D3":
      return "Production / SQE owner";
    case "D4":
      return "Cross-functional team";
    case "D5":
    case "D6":
      return "Process owner";
    case "D7":
      return "Quality system owner";
    default:
      return "Quality team";
  }
}

export function SeoLandingPage({ page }: { page: SeoPage }) {
  const relatedPages = getRelatedSeoPages(page);
  const jsonLd = buildJsonLd(page);

  return (
    <div className="bg-white text-slate-950">
      <SeoPageViewTracker page={page} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {page.industry || "8D Reports"} / {page.problemType || page.type}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SeoPrimaryCta page={page} />
              <Link
                href="/resources"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
              >
                Browse Resources
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-xs font-medium text-slate-500">Complete report snapshot</p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {page.example?.problemDescription || page.title}
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["No.", "Report number", "8D-2026-014"],
                  ["Scope", "Affected scope", page.professional.affectedScope],
                  ["Risk", "Customer impact", page.professional.customerImpact],
                  ["Verify", "Closure evidence", page.professional.verification],
                ].map(([step, label, text]) => (
                  <div key={step} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                        {step}
                      </span>
                      <span className="text-sm font-semibold text-slate-950">{label}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Built for practical quality work
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              These pages are written for quality teams that need evidence,
              ownership, verification, and a report that can be exported or
              shared without rebuilding the same template every time.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Structured report",
                text: "D0-D8 sections keep the investigation readable.",
              },
              {
                icon: ShieldCheck,
                title: "Evidence attached",
                text: "Photos and files stay tied to the relevant step.",
              },
              {
                icon: Search,
                title: "Reusable history",
                text: "Pro search helps find similar past issues.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 p-5">
                <item.icon className="h-5 w-5 text-indigo-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Example content for this scenario
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The wording should be specific enough for a real corrective action
              review, not just a generic template heading.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {page.sections.map((section) => (
              <article key={section.heading} className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  {section.heading}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              How to use this page
            </h2>
            <div className="mt-6 space-y-4">
              {[
                "Describe the problem with product, batch, timing, customer impact, and measurable defect evidence.",
                "Add containment actions that protect the customer before permanent correction is complete.",
                "Analyze root cause using 5-Why, fishbone, process evidence, and escape-cause review.",
                "Define corrective and preventive actions with owners, due dates, and verification method.",
                "Export or share the report so reviewers can see both the narrative and supporting attachments.",
              ].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-semibold text-indigo-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Create the first report free
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Free includes 5 lifetime reports and the complete editor. Upgrade
              when no-watermark export, Word export, company logo, editable
              sharing, or deep historical search becomes valuable.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <SeoPrimaryCta page={page} label="Create Your 8D Report" />
              <SeoTemplateCta page={page} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Complete 8D sample
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              A full report example, not a heading-only template
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A real 8D needs more than D-step labels. This sample includes
              report metadata, D0-D8 content, owner, evidence, containment,
              root cause, corrective action, preventive control, verification,
              and closure expectations.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid bg-slate-50 text-sm md:grid-cols-4">
              {[
                ["Report no.", "8D-2026-014"],
                ["Report type", page.type === "8d-template" ? "Template-ready 8D" : "Customer-ready 8D"],
                ["Status", "Completed sample"],
                ["Review level", "Customer / SQE review"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 p-4 md:border-r md:last:border-r-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 font-medium text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-200">
              {page.professional.eightD.map((item) => (
                <article
                  key={item.step}
                  className="grid gap-4 bg-white p-5 lg:grid-cols-[72px_1fr_180px_1.1fr]"
                >
                  <div>
                    <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.content}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Owner
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {ownerForStep(item.step)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Evidence required
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {evidenceForStep(page, item.step)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Attachment package expected
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                A reviewer should be able to open the exported package and see
                the evidence behind the conclusion. For this case, include:
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {[
                  page.professional.detection,
                  page.professional.metric,
                  page.example?.containmentAction || "containment records and suspect stock list",
                  page.professional.verification,
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Closure checklist
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Do not close the 8D until these items are visible in the report:
              </p>
              <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                {[
                  "Problem is quantified with date, lot, product, and risk.",
                  "Containment protects customer and internal stock.",
                  "Occurrence root cause and escape point are both explained.",
                  "Corrective action removes the verified process cause.",
                  "Verification evidence proves the fix is effective.",
                  "Prevention is added to the control system, not just the report.",
                ].map((item) => (
                  <div key={item} className="rounded-md bg-white p-3 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Professional quality details
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Evidence a quality reviewer would expect to see
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              This {pageTypeLabel(page)} includes the measurable scope,
              detection method, escape point, customer risk, and verification
              criteria that usually decide whether an 8D is accepted or sent
              back for rework.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Affected scope", page.professional.affectedScope],
              ["Measured evidence", page.professional.metric],
              ["Detection method", page.professional.detection],
              ["Escape point", page.professional.escapePoint],
              ["Customer impact", page.professional.customerImpact],
              ["Verification criteria", page.professional.verification],
            ].map(([label, text]) => (
              <article key={label} className="rounded-lg border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              D0-D8 example wording
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A professional 8D should separate containment from permanent
              correction, show both root cause and escape point, and close only
              after verification evidence is attached.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {page.professional.eightD.map((item) => (
              <article key={item.step} className="rounded-lg bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                    {item.step}
                  </span>
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.content}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {(page.type === "5why-example" || page.type === "8d-example") && (
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                5 Why chain
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The chain below keeps the logic visible. It avoids jumping from
                symptom to action without showing why the selected correction
                addresses the actual process weakness.
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
              {page.professional.fiveWhy.map((item, index) => (
                <article
                  key={item.why}
                  className="grid gap-3 border-b border-slate-200 bg-white p-5 last:border-b-0 md:grid-cols-[160px_1fr]"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-indigo-700">
                      Why {index + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                      {item.why}
                    </h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {(page.type === "fishbone-example" || page.type === "8d-example") && (
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Fishbone 6M analysis
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                A fishbone page should show more than a final root cause. These
                6M prompts help the team check competing causes before locking
                the 8D conclusion.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {page.professional.fishbone.map((item) => (
                <article key={item.category} className="rounded-lg border border-slate-200 p-5">
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.category}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.possibleCause}
                  </p>
                  <p className="mt-3 rounded bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    Check: {item.check}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {(page.type === "corrective-action" ||
        page.type === "preventive-action" ||
        page.type === "8d-template") && (
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Action ownership and effectiveness checks
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Corrective and preventive actions need owners, due dates, and
                evidence. Otherwise the report is only a statement of intent.
              </p>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-5 py-3">
                  <h3 className="text-base font-semibold text-slate-950">
                    Corrective action plan
                  </h3>
                </div>
                {page.professional.actionPlan.map((item) => (
                  <article key={item.action} className="border-t border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.action}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-3">
                      <p>Owner: {item.owner}</p>
                      <p>Due: {item.due}</p>
                      <p>Verify: {item.verification}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-5 py-3">
                  <h3 className="text-base font-semibold text-slate-950">
                    Preventive controls
                  </h3>
                </div>
                {page.professional.preventionPlan.map((item) => (
                  <article key={item.control} className="border-t border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.control}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-3">
                      <p>Frequency: {item.frequency}</p>
                      <p>Owner: {item.owner}</p>
                      <p>Evidence: {item.evidence}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            FAQ
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {page.faqs.map((item) => (
              <article key={item.question} className="rounded-lg bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-950">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Related resources
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Follow related examples, templates, root-cause pages, and action
                pages so this page is not an isolated SEO entry.
              </p>
            </div>
            <Link href="/sample-report" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
              View full sample report
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedPages.map((related) => (
              <Link
                key={related.slug}
                href={`/${related.slug}`}
                className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                  {displayPath(related.slug)}
                </p>
                <h3 className="mt-3 text-base font-semibold text-slate-950">
                  {related.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {related.metaDescription}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Turn this example into your own 8D report.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Start with the structured editor, attach evidence, then export or
              share a report your customer can review.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SeoPrimaryCta page={page} label="Create Your 8D Report" />
            <SeoTemplateCta page={page} />
          </div>
        </div>
      </section>
    </div>
  );
}
