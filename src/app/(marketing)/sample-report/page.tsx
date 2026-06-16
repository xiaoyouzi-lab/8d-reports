import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  ImageIcon,
  Search,
  Share2,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sample 8D Report | 8D Reports",
  description:
    "Review a practical sample 8D report with D0-D8 sections, evidence attachments, export, sharing, and Pro search examples.",
  alternates: { canonical: "https://www.8d-reports.com/sample-report" },
}

const reportSections = [
  {
    step: "D0",
    title: "Prepare",
    text: "Customer complaint opened for coating peel-off on brake bracket batch B26-041. Quality engineer assigned owner, scope, and first response date.",
  },
  {
    step: "D1",
    title: "Team",
    text: "Quality engineering, production supervisor, coating process owner, warehouse, and supplier quality joined the investigation.",
  },
  {
    step: "D2",
    title: "Problem Description",
    text: "18 of 500 brackets showed visible coating peel-off after salt spray validation. Issue limited to line 2, shift B, production date 2026-05-18.",
  },
  {
    step: "D3",
    title: "Containment",
    text: "Blocked affected stock, started 100% visual inspection, notified customer service, and added temporary outgoing inspection for all open shipments.",
  },
  {
    step: "D4",
    title: "Root Cause",
    text: "Occurrence cause: fixture cleaning check was skipped before line change. Escape cause: outgoing inspection checklist did not include coating edge adhesion.",
  },
  {
    step: "D5",
    title: "Corrective Action",
    text: "Added mandatory fixture cleaning sign-off, updated coating setup checklist, and retrained shift B operators before restart.",
  },
  {
    step: "D6",
    title: "Verify",
    text: "Three follow-up lots passed adhesion and visual checks. No repeat defect found after 1,500 pcs shipped.",
  },
  {
    step: "D7",
    title: "Prevent Recurrence",
    text: "Updated control plan, layered audit checklist, and similar line startup checklist. Lesson added for future coating changeovers.",
  },
  {
    step: "D8",
    title: "Close",
    text: "Customer accepted the corrective action package. Team recognition and final lessons learned recorded.",
  },
]

const evidenceItems = [
  {
    icon: ImageIcon,
    title: "D2 photo evidence",
    text: "Coating peel-off photo shown in exported report and shared view.",
  },
  {
    icon: FileText,
    title: "D5 inspection file",
    text: "Supporting files are preserved in the export package attachments folder.",
  },
  {
    icon: Download,
    title: "Customer-ready export",
    text: "Free PDF includes watermark. Pro removes watermark and unlocks Word export.",
  },
  {
    icon: Share2,
    title: "Share link",
    text: "Free supports view-only sharing. Pro can use editable share links.",
  },
]

export default function SampleReportPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Sample 8D report
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              See what a finished online 8D report can look like.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              This example shows the product goal clearly: complete D0-D8,
              attach evidence, export a customer-ready report, and reuse the
              history later with Pro search.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                )}
              >
                Create free report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#pricing"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-slate-300 px-6"
                )}
              >
                Compare Free vs Pro
              </Link>
              <Link
                href="/api/sample-reports/automotive"
                rel="nofollow"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-slate-300 px-6"
                )}
              >
                Download sample PDF
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-indigo-600">
                      2026-05-18-001
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      Brake bracket coating failure
                    </h2>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Completed
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Customer", "Northline Motors"],
                    ["Priority", "High"],
                    ["Owner", "Quality engineer"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid divide-y divide-slate-200">
                {reportSections.slice(0, 5).map((section) => (
                  <div key={section.step} className="grid gap-3 p-5 sm:grid-cols-[90px_1fr]">
                    <div>
                      <span className="rounded-md bg-indigo-50 px-2.5 py-1 font-mono text-sm font-semibold text-indigo-700">
                        {section.step}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        {section.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {section.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Complete D0-D8 structure
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The app keeps the report structured without hiding the judgment
              work. Each step stays readable when exported or shared.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {reportSections.map((section) => (
              <article key={section.step} className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-indigo-600 px-2.5 py-1 font-mono text-sm font-semibold text-white">
                    {section.step}
                  </span>
                  <h3 className="text-base font-semibold text-slate-950">
                    {section.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {section.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Evidence, export, and sharing are part of the report.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A useful 8D tool must preserve supporting evidence. The current
              product direction keeps photos visible and files included in the
              exported package.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {evidenceItems.map((item) => (
              <article key={item.title} className="rounded-lg bg-white p-5 shadow-sm">
                <item.icon className="h-5 w-5 text-indigo-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">fixture cleaning skipped</span>
              <span className="ml-auto rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Pro
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Root Cause matched: fixture cleaning check was skipped before line change.",
                "Corrective Action matched: mandatory cleaning sign-off added to startup checklist.",
                "Lessons Learned matched: reuse this checklist on coating line changeovers.",
              ].map((text) => (
                <div key={text} className="rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-700">
                  {text}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              The Pro value is not just removing a watermark.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Once users have multiple completed reports, historical search
              turns the tool into a lightweight quality knowledge base.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Free: 3 lifetime reports and basic dashboard search.",
                "Pro: unlimited personal reports, Word export, no watermark, company logo, editable sharing, and deep history search.",
                "Team: 5 seats, shared report workspace, and team-wide search/export permissions.",
                "Single export: $4.99 unlocks no-watermark PDF and Word export for one selected report.",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to create your own report?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Start with the full editor for free. Upgrade only when formal
              delivery and historical reuse become valuable.
            </p>
          </div>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 shrink-0 bg-indigo-600 px-6 hover:bg-indigo-700"
            )}
          >
            Create free report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
