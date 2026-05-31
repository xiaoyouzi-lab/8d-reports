import Link from "next/link"
import { ArrowRight, Check, FileText, Search, ShieldCheck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import type { SeoPage } from "@/lib/seo-pages"
import { cn } from "@/lib/utils"

export function SeoLandingPage({ page }: { page: SeoPage }) {
  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                )}
              >
                Create free 8D report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sample-report"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-slate-300 px-6"
                )}
              >
                View sample report
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Report #8D-2026-014
                  </p>
                  <p className="text-base font-semibold text-slate-950">
                    Guided D0-D8 report
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Saved
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["D2", "Describe the problem clearly"],
                  ["D3", "Contain affected products"],
                  ["D4", "Verify root cause"],
                  ["D5", "Define corrective action"],
                  ["D7", "Prevent recurrence"],
                ].map(([step, text]) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                      {step}
                    </span>
                    <span className="text-sm text-slate-700">{text}</span>
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
              What quality teams need from this workflow
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The goal is not to replace quality judgment. It is to make the
              report easier to complete, review, export, and reuse.
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
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Practical checklist
            </h2>
            <div className="mt-6 space-y-3">
              {page.checklist.map((item) => (
                <div key={item} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
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
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                )}
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sample-report"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-indigo-200 bg-white px-6"
                )}
              >
                See example
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Questions quality teams ask
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {page.faq.map((item) => (
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
    </div>
  )
}
