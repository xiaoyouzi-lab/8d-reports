import Link from "next/link";
import { FileText, Search, ShieldCheck } from "lucide-react";
import type { SeoPage } from "@/content/seo-pages";
import { getRelatedSeoPages } from "@/content/seo-pages";
import { SeoPageViewTracker, SeoPrimaryCta, SeoTemplateCta } from "./SeoTracking";

const baseUrl = "https://www.8d-reports.com";

function displayPath(slug: string) {
  return `/${slug}`;
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
                href="/sample-report"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
              >
                View Sample
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-xs font-medium text-slate-500">Quality scenario</p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {page.example?.problemDescription || page.title}
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["D3", "Containment", page.example?.containmentAction],
                  ["D4", "Root cause", page.example?.rootCause],
                  ["D5", "Corrective action", page.example?.correctiveAction],
                  ["D7", "Prevention", page.example?.preventiveAction],
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
