import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ShieldCheck } from "lucide-react"
import { RejectCheckIntake } from "@/components/rejection-review/RejectCheckIntake"

export const metadata: Metadata = {
  title: "8D Reject Check | Find Rejection Risk Before Submission",
  description:
    "Find rejection risks, logic gaps, weak corrective actions, and missing evidence in your 8D or SCAR before customer submission.",
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
      <section className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Find out why your 8D won&apos;t stand up—before your customer sends it back.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Paste or upload the 8D, SCAR, or corrective-action response you plan to send in the next 24–72 hours. The free check shows whether it is ready to submit and the three biggest rejection risks.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-700">
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> Deterministic checks run before AI explanation or rewriting</div>
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> Every finding points to supplied text or a named missing fact</div>
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600" /> No invented dates, quantities, evidence, results, approvals, or root causes</div>
            </div>
          </div>
          <RejectCheckIntake />
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">What the complete review challenges</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {checks.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
            <span className="font-semibold text-slate-950">Complete Rejection Risk Review: $39 once.</span>{" "}
            It includes all section findings, evidence gaps, likely follow-up questions, fact-safe English rewrites, and a downloadable review package. It does not guarantee customer acceptance, certify compliance, confirm root cause, or prove effectiveness.
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/zh/8d-report-review-service" className="font-medium text-indigo-600 hover:text-indigo-700">查看中文页面</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
