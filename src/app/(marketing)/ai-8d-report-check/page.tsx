import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "AI 8D Report Check",
  description:
    "Run an automated AI Quality Check on an 8D report to find missing evidence, weak root-cause logic, and unclear validation before customer submission.",
  alternates: {
    canonical: "https://www.8d-reports.com/ai-8d-report-check",
  },
}

const checks = [
  "Problem description is measurable and scoped",
  "Containment is separate from permanent corrective action",
  "Root cause separates occurrence and escape cause",
  "Corrective actions trace to the verified root cause",
  "Validation includes a method, sample, and result",
  "Prevention updates the system, not only the part",
  "Missing evidence is flagged instead of invented",
]

export default function Ai8dReportCheckPage() {
  return (
    <div className="bg-white font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              AI 8D report check
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Check your 8D report before the customer does.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              AI Quality Check is an automated in-app review of the report you
              saved. It looks for missing evidence, weak root-cause logic,
              unclear corrective actions, and thin validation, then lists the
              gaps to fix. It does not approve the report or replace your
              quality owner.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 hover:bg-indigo-700")}
              >
                Start a free report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sample-report" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                See a sample report
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileSearch className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Included with the editor</p>
                <p className="text-xl font-semibold text-slate-950">Automated gap review</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Runs on the saved report content
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Flags gaps without inventing evidence
              </div>
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" /> Approval stays with your quality owner
              </div>
            </div>
            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              AI findings are review prompts. They do not approve, certify, or
              replace engineering judgment.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            What the automated check looks for
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
