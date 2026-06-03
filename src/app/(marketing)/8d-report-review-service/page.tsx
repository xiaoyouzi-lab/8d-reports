import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, FileSearch } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "8D Report Review Service | Quality Expert Review",
  description:
    "Get a quality expert style review of your 8D report before customer submission. Check problem description, containment, root cause, corrective action, verification, and prevention.",
  alternates: {
    canonical: "https://www.8d-reports.com/8d-report-review-service",
  },
}

const checks = [
  "Problem description is clear, measurable, and customer-readable",
  "Containment is immediate, scoped, owned, and verifiable",
  "Root cause is not generic and connects to evidence",
  "Corrective action matches the verified root cause",
  "Verification includes objective evidence",
  "Preventive action reduces recurrence risk",
  "Customer rejection risks are called out before submission",
]

export default function ReportReviewServicePage() {
  return (
    <div className="bg-white font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              8D report review service
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Check your 8D before the customer sends it back.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The review service is designed for urgent customer submissions. A quality expert style review checks
              the logic, evidence, wording, and customer rejection risks before you send the final report.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 hover:bg-indigo-700")}
              >
                Join beta review
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sample-report" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                View sample report
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileSearch className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Planned price</p>
                <p className="font-mono text-3xl font-semibold text-slate-950">$49-$99/report</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 text-indigo-600" /> 24-hour target review window after launch</div>
              <div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> AI-assisted, quality-owner reviewed workflow planned</div>
            </div>
            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Currently beta-only. AI suggestions do not approve the report and do not replace your quality owner.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">What the review checks</h2>
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
