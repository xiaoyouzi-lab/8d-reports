import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { runDeterministicRejectionReview } from "@/lib/rejection-review/rules"
import { toFreeRejectionRiskPreview } from "@/lib/rejection-review/schema"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "8D Reject Check Sample Review",
  description: "See the free rejection-risk scan and the depth of a paid 24-hour Deep Review on synthetic 8D content.",
}

const syntheticReport = `
D2 Problem Description
Customer found 12 loose connectors in 600 units from lot L2408 on 2026-07-28. Required pull force is at least 40 N; measured values were 18–26 N.
D3 Containment
100% inspection was added.
D4 Root Cause
Occurrence cause: employee negligence during assembly.
Escape cause: employee negligence during assembly.
D5 Corrective Action
Retrain the operator and continue 100% inspection. Replace the packaging label printer.
D6 Verification
The action is expected to work.
`

export default function RejectCheckSamplePage() {
  const full = runDeterministicRejectionReview(syntheticReport)
  const free = toFreeRejectionRiskPreview(full)

  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/8d-report-review-service" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
          <ArrowLeft className="size-4" /> Back to 8D Reject Check
        </Link>
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm leading-6 text-indigo-950">
          <strong>Synthetic product sample.</strong> This example contains no customer data and was created to test human-error, training-only, inspection-only, cause-separation, action-linkage, evidence, and verification checks. It is not a claim about any real customer report.
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-indigo-600">What the free scan shows</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">High rejection risk</h1>
            <div className="mt-5 space-y-4">
              {free.topRejectionRisks.map((finding) => (
                <article key={finding.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" /><h2 className="font-semibold text-amber-950">{finding.title}</h2></div>
                  <p className="mt-2 text-sm leading-6 text-amber-900">{finding.explanation}</p>
                </article>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-600">Missing categories: {free.missingInformationCategories.join(", ") || "none detected"}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> What the paid Deep Review adds</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">All supported findings and actions</h2>
            <div className="mt-5 space-y-4">
              {full.findings.map((finding) => (
                <article key={finding.id} className="border-b border-slate-200 pb-4 last:border-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{finding.section} · {finding.severity}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{finding.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{finding.explanation}</p>
                  <p className="mt-2 text-sm text-slate-700"><strong>Customer may ask:</strong> {finding.likelyCustomerQuestion}</p>
                  {finding.factsNeeded.length > 0 && <p className="mt-2 text-sm text-slate-700"><strong>Add:</strong> {finding.factsNeeded.join("; ")}</p>}
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-950">Fact-safe English rewrite example</p>
              <p className="mt-2">“Customer inspection identified 12 connectors below the 40 N pull-force requirement among 600 units from lot L2408. Measured values were 18–26 N.”</p>
              <p className="mt-2 text-amber-800">The rewrite stops there: it does not invent containment ownership, implementation dates, proof, or validation results.</p>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row">
          <div><p className="font-semibold">Run the same free scan on your report</p><p className="mt-1 text-sm text-slate-300">Paid delivery is $99 and is internally reviewed before release.</p></div>
          <Link href="/8d-report-review-service" className={cn(buttonVariants({ size: "lg" }), "bg-white text-slate-950 hover:bg-slate-100")}><LockKeyhole className="size-4" /> Start free</Link>
        </div>
      </div>
    </main>
  )
}
