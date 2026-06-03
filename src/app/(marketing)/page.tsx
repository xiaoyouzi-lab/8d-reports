import Link from "next/link"
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Search,
  Share2,
  Sparkles,
  Smartphone,
  Upload,
} from "lucide-react"
import { CheckoutButton } from "@/components/CheckoutButton"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const workflowSteps = [
  {
    number: "01",
    title: "Walk the floor with your phone",
    description:
      "Open the report at the line, capture D0-D8 information while the issue is fresh, and avoid rebuilding notes later from photos and chat messages.",
  },
  {
    number: "02",
    title: "Attach photos and evidence on the spot",
    description:
      "Take photos, upload inspection records, and keep every file tied to the right D-step so the exported report still tells the full story.",
  },
  {
    number: "03",
    title: "Share, edit, export, and reuse",
    description:
      "Share a view-only or editable link with suppliers, customers, or internal owners, then export a customer-ready PDF or Word report.",
  },
]

const freeFeatures = [
  "3 lifetime reports",
  "Complete D0-D8 editor",
  "PDF export with watermark",
  "Basic dashboard search by title, report number, and status",
  "View-only share links",
]

const proFeatures = [
  "Unlimited reports",
  "PDF export without watermark",
  "Word export",
  "Company logo on deliverables",
  "Deep search across problem descriptions, root causes, actions, and lessons learned",
  "Editable share links",
]

const teamFeatures = [
  "Everything in Pro",
  "5 seats included",
  "Team report workspace",
  "Team members can edit, share, export, and search team reports",
]

const faqs = [
  {
    q: "What can I do on the Free plan?",
    a: "Free includes 3 lifetime reports, the full D0-D8 editing flow, attachment support, view-only sharing, basic dashboard search, and PDF export with a watermark.",
  },
  {
    q: "Why would a quality engineer upgrade to Pro?",
    a: "Pro is for individual users who deliver reports regularly and want their 8D history to become searchable knowledge: unlimited reports, no watermark, Word export, company logo, and deep historical search.",
  },
  {
    q: "How does dashboard search differ between Free and Pro?",
    a: "Free searches basic report metadata. Pro searches the full report history, including problem descriptions, containment actions, root causes, corrective actions, prevention steps, and lessons learned.",
  },
  {
    q: "Is AI report drafting available now?",
    a: "Not yet. The product keeps a lightweight interest entry in the editor so we can validate demand before building full AI drafting for D0-D8 reports.",
  },
  {
    q: "Can I share reports with customers?",
    a: "Yes. Free users can create view-only links. Pro users can also create editable links when a supplier or customer needs to contribute directly.",
  },
  {
    q: "What happens after I create 3 reports?",
    a: "Your existing Free reports remain accessible. Creating more reports requires Pro or Team. If you only need to deliver one report, you can buy a single report export for $4.99.",
  },
]

const seoResources = [
  { href: "/resources", label: "All Resources" },
  { href: "/8d-report-example/automotive", label: "Automotive 8D Example" },
  { href: "/8d-report-example/supplier-quality", label: "Supplier 8D Example" },
  {
    href: "/fishbone-diagram-example/manufacturing-defect",
    label: "Fishbone Example",
  },
  { href: "/5-why-example/customer-complaint", label: "5 Why Example" },
]

function HeroProductPreview() {
  const steps = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"]

  return (
    <div className="relative pb-10 sm:pb-8">
      <div className="rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Report #8D-2026-014
            </p>
            <p className="text-sm font-semibold text-slate-950">
              Brake bracket coating failure
            </p>
          </div>
          <div className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Saved
          </div>
        </div>

        <div className="grid min-h-[420px] grid-cols-[78px_1fr] sm:grid-cols-[104px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50/80 p-3">
            <div className="space-y-1.5">
              {steps.map((step) => (
                <div
                  key={step}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-semibold",
                    step === "D2"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500"
                  )}
                >
                  {step}
                </div>
              ))}
            </div>
          </aside>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-indigo-600">
                  D2 Problem Description
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  What happened, where, and how often?
                </h3>
              </div>
              <div className="flex gap-2">
                <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  PDF
                </span>
                <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs text-white">
                  Word Pro
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Problem statement
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Customer found coating peel-off on brake bracket batch
                  B26-041 after salt spray validation. Initial rate: 18 / 500
                  pcs.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Product / batch", "BRK-2009 / B26-041"],
                  ["Customer", "Northline Motors"],
                  ["Containment", "100% visual inspection started"],
                  ["Owner", "Quality engineering"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <Upload className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  3 evidence files attached
                </span>
                <span className="text-xs text-slate-500">
                  inspection sheet, photo, coating log
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 left-5 right-5 rounded-lg border border-indigo-100 bg-white p-4 shadow-[0_18px_48px_rgba(79,70,229,0.18)] sm:left-auto sm:right-[-24px] sm:w-80">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Search className="h-4 w-4 text-indigo-600" />
          Pro deep search
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Root Cause matched: coating fixture check skipped before line change.
        </p>
      </div>
    </div>
  )
}

function DeepSearchPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <Search className="h-4 w-4 text-slate-500" />
        <span className="text-sm text-slate-700">fixture check skipped</span>
        <span className="ml-auto rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          Pro
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {[
          {
            title: "Brake bracket coating failure",
            meta: "Root Cause matched",
            text: "Operator skipped fixture check before line change; preventive action added sign-off control.",
          },
          {
            title: "Housing seal leak after assembly",
            meta: "Corrective Action matched",
            text: "Fixture verification moved from weekly audit to every batch start.",
          },
          {
            title: "Connector pin deformation",
            meta: "Lessons Learned matched",
            text: "Reuse fixture checklist for similar high-mix production lines.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-slate-200 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">
                {item.title}
              </p>
              <span className="text-xs font-medium text-emerald-700">
                {item.meta}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-white font-sans text-slate-950">
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pb-28">
          <div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Finish 8D reports from the factory floor.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Bring your phone to the line, capture photos and inspection
              records on the spot, guide the team through D0-D8, share the
              report for review, and export a customer-ready 8D without
              rebuilding everything in a spreadsheet.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sample-report"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 w-full bg-indigo-600 px-6 text-base hover:bg-indigo-700 sm:w-auto"
                )}
              >
                View sample 8D report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/resources"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 w-full border-slate-300 px-6 text-base sm:w-auto"
                )}
              >
                Browse complete samples
              </Link>
              <Link
                href="/api/sample-reports/automotive"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 w-full border-slate-300 px-6 text-base sm:w-auto"
                )}
              >
                Download sample PDF
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 w-full border-slate-300 px-6 text-base sm:w-auto"
                )}
              >
                Create free report
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["Mobile", "capture evidence at the source"],
                ["D0-D8", "guided factory-floor workflow"],
                ["Share", "view or editable review links"],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-slate-200 pl-4">
                  <p className="font-mono text-2xl font-semibold text-slate-950">
                    {value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <HeroProductPreview />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50/70 py-12">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: Smartphone,
              title: "Built for the shop floor",
              text: "Use a phone or tablet to capture the issue, photos, containment, and owners while standing near the process.",
            },
            {
              icon: Upload,
              title: "Evidence stays attached",
              text: "Photos, inspection records, and files stay linked to the exact D-step instead of getting lost in chat threads.",
            },
            {
              icon: Share2,
              title: "Shared review links",
              text: "Send a report to suppliers, customers, or internal owners for view-only review or editable collaboration.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-white p-5 shadow-sm">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h2 className="mt-4 text-base font-semibold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="pro-search" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Pro turns old reports into a quality knowledge base.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The first version stays practical: no complex search engine, just
              reliable server-side search across the fields that matter most to
              quality engineers.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Free: search titles, report numbers, and status across the 3 included reports.",
                "Pro and Team: search all historical problem descriptions, root causes, corrective actions, prevention steps, and lessons learned.",
                "Each result shows why it matched, so users can quickly reopen the right report.",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <DeepSearchPreview />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              From first report to repeatable 8D practice.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The main workflow is intentionally simple, because the first
              business goal is clear: help users finish and export a real
              report.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <div key={step.number} className="rounded-lg bg-white p-6 shadow-sm">
                <p className="font-mono text-sm font-semibold text-indigo-600">
                  {step.number}
                </p>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Free for evaluation. Pro and Team for delivery and reuse.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The paywall is designed around visible value: no watermark,
              unlimited reports, Word export, company logo, team access, and deep search.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-slate-950">Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-slate-950">
                  $0
                </span>
                <span className="text-sm text-slate-500">/forever</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                For trying the complete 8D workflow and producing occasional
                reports.
              </p>
              <FeatureList features={freeFeatures} />
              <Link
                href="/sample-report"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-8 h-11 w-full border-slate-300"
                )}
              >
                View sample first
              </Link>
              <Link
                href="/login"
                className="mt-3 block text-center text-sm font-medium text-indigo-700 underline underline-offset-4 hover:text-indigo-900"
              >
                Start free with 3 reports
              </Link>
            </div>

            <div className="rounded-lg border-2 border-indigo-600 bg-white p-8 shadow-[0_24px_80px_rgba(79,70,229,0.16)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-950">Pro</h3>
                <div className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  Recommended
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-slate-950">
                  $19
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                For quality professionals who need formal deliverables and a
                reusable 8D history.
              </p>
              <FeatureList features={proFeatures} />
              <CheckoutButton
                planType="pro_monthly"
                className="mt-8 h-11 w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Start Pro monthly
              </CheckoutButton>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-slate-950">Team</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-slate-950">
                  $99
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                For small quality teams that need shared access to 8D reports.
              </p>
              <FeatureList features={teamFeatures} />
              <CheckoutButton
                planType="team_monthly"
                className="mt-8 h-11 w-full bg-slate-950 hover:bg-slate-800"
              >
                Start Team monthly
              </CheckoutButton>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-slate-600">
            Need one formal delivery without a subscription? Single report export is $4.99 and unlocks no-watermark PDF plus Word for that report only.{" "}
            <Link href="/custom-8d-template-setup" className="font-medium text-indigo-600 hover:text-indigo-700">
              Custom 8D template setup starts at $299.
            </Link>
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Sparkles className="h-6 w-6 text-indigo-300" />
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              AI report drafting is positioned as the next Pro expansion.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              The first month should validate report completion and paid
              delivery. AI stays visible enough to measure interest without
              slowing the launch.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LockKeyhole className="h-4 w-4 text-indigo-300" />
              AI report drafting coming soon
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Customer complaint email",
                "Inspection records",
                "Photo descriptions",
                "5Why draft",
                "Containment notes",
                "Responsible owner and dates",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Future goal: generate a D0-D8 draft for review, not automatic
              approval.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50/70 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Complete 8D examples and quality resources
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Practical pages for quality engineers who need full examples,
                not heading-only templates: D0-D8 wording, attachments,
                containment, root cause, corrective action, prevention, and
                closure evidence.
              </p>
            </div>
            <Link
              href="/resources"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Browse all resources
            </Link>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {seoResources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50"
              >
                {resource.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The current product boundary is intentionally clear so the first
              30 days can focus on activation and paid conversion.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-950">
                  {faq.q}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Ready to finish the first real report?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start free, create up to 3 reports, and upgrade when formal
              delivery or historical search becomes valuable.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sample-report"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 shrink-0 bg-indigo-600 px-6 hover:bg-indigo-700"
              )}
            >
              View sample report
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 shrink-0 border-slate-300 px-6"
              )}
            >
              Create free report
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-slate-500">
            &copy; 2026 8D Reports. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Security", href: "/security" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-slate-500 transition-colors hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
