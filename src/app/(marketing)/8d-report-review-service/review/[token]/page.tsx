import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { ReviewViewTracker } from "@/components/rejection-review/ReviewViewTracker"
import { ReviewPurchasePanel } from "@/components/rejection-review/ReviewPurchasePanel"
import { getSessionUser } from "@/lib/api-helpers"
import { getRejectionReviewTaskByToken } from "@/lib/rejection-review/service"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Free 8D Rejection Risk Result",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

const statusCopy = {
  not_suitable_to_submit: {
    label: "Not suitable to submit",
    className: "border-red-200 bg-red-50 text-red-950",
  },
  high_risk: {
    label: "High rejection risk",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  submittable_with_risk: {
    label: "Submittable, with remaining risk",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
}

export default async function FreeReviewResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [task, user] = await Promise.all([getRejectionReviewTaskByToken(token), getSessionUser()])
  if (!task) notFound()
  const preview = task.freeResultJson
  const status = statusCopy[preview.status]

  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <ReviewViewTracker taskToken={token} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link href="/8d-report-review-service" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Check another report
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-indigo-600">Free preliminary review</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Your submission risk result</h1>
          <div className={cn("mt-6 flex items-start gap-3 rounded-xl border p-4", status.className)}>
            {preview.status === "submittable_with_risk"
              ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              : <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
            <div>
              <div className="font-semibold">{status.label}</div>
              <p className="mt-1 text-sm opacity-80">This status is based only on the text supplied and is not customer approval.</p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-slate-950">Three most serious risks</h2>
            {preview.topRejectionRisks.length ? (
              <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
                {preview.topRejectionRisks.map((finding) => (
                  <article key={finding.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="text-indigo-600">{finding.section}</span>
                      <span className="text-slate-400">·</span>
                      <span className={finding.severity === "critical" ? "text-red-700" : finding.severity === "high" ? "text-amber-700" : "text-slate-600"}>
                        {finding.severity} risk
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-950">{finding.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{finding.explanation}</p>
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                      <span className="font-semibold text-slate-800">Source: </span>
                      {finding.source.excerpt || "Required information was not found in the supplied text."}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
                No material high-risk finding was detected by the deterministic check. The complete review still checks section logic, evidence traceability, customer questions, and wording without inventing concerns.
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-slate-950">Missing information categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {preview.missingInformationCategories.length
                ? preview.missingInformationCategories.map((category) => (
                    <span key={category} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                      {category.replace(/_/g, " ")}
                    </span>
                  ))
                : <span className="text-sm text-slate-600">No missing category was detected from the supplied text.</span>}
            </div>
          </section>
        </div>

        <ReviewPurchasePanel token={token} signedIn={Boolean(user)} />
        <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-500">{preview.disclaimer}</p>
      </div>
    </main>
  )
}
