"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Download, Loader2, LockKeyhole } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import type { ConciergeReviewDeliverable } from "@/lib/rejection-review/schema"

type PurchaseState = {
  status: string
  hasFullAccess: boolean
  deliveryStatus?: "not_purchased" | "in_progress" | "ready" | "revoked"
  checkoutUrl?: string | null
}

export function ReviewPurchasePanel({ token, signedIn }: { token: string; signedIn: boolean }) {
  const [purchase, setPurchase] = useState<PurchaseState | null>(null)
  const [deliverable, setDeliverable] = useState<ConciergeReviewDeliverable | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refundRequested, setRefundRequested] = useState(false)

  const loadPurchase = useCallback(async () => {
    if (!signedIn) return
    const response = await fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/purchase`, {
      cache: "no-store",
    })
    if (!response.ok) return
    const next = await response.json() as PurchaseState
    setPurchase(next)
    if (next.hasFullAccess) {
      const result = await fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/full`, {
        cache: "no-store",
      })
      if (result.ok) {
        const body = await result.json() as { result: ConciergeReviewDeliverable }
        setDeliverable(body.result)
      }
    }
  }, [signedIn, token])

  useEffect(() => {
    if (!signedIn) return
    const controller = new AbortController()
    fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/purchase`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) return null
      const next = await response.json() as PurchaseState
      if (!next.hasFullAccess) return { next, full: null }
      const result = await fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/full`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const full = result.ok
        ? (await result.json() as { result: ConciergeReviewDeliverable }).result
        : null
      return { next, full }
    }).then((value) => {
      if (!value || controller.signal.aborted) return
      setPurchase(value.next)
      if (value.full) setDeliverable(value.full)
    }).catch(() => {})
    return () => controller.abort()
  }, [signedIn, token])

  useEffect(() => {
    if (purchase?.deliveryStatus !== "in_progress") return
    const timer = window.setInterval(() => void loadPurchase(), 30_000)
    return () => window.clearInterval(timer)
  }, [loadPurchase, purchase?.deliveryStatus])

  const startCheckout = async () => {
    if (!signedIn) {
      const response = await fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/return-cookie`, {
        method: "POST",
      })
      const body = await response.json().catch(() => ({})) as { callbackPath?: string }
      const callback = response.ok && body.callbackPath
        ? body.callbackPath
        : "/8d-report-review-service"
      window.location.assign(`/login?callbackUrl=${encodeURIComponent(callback)}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const body = await response.json().catch(() => ({})) as { checkout_url?: string | null; error?: string }
      if (!response.ok) throw new Error(body.error || "Secure checkout is temporarily unavailable.")
      if (body.checkout_url) {
        window.location.assign(body.checkout_url)
        return
      }
      await loadPurchase()
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Secure checkout is temporarily unavailable.")
    } finally {
      setLoading(false)
    }
  }

  const requestRefund = async () => {
    setLoading(true)
    setError(null)
    const response = await fetch(`/api/rejection-reviews/${encodeURIComponent(token)}/refund-request`, {
      method: "POST",
    })
    const body = await response.json().catch(() => ({})) as { error?: string }
    setLoading(false)
    if (!response.ok) {
      setError(body.error || "The refund request could not be recorded.")
      return
    }
    setRefundRequested(true)
  }

  if (deliverable) {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 size-6 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">24-hour Deep Review delivered</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Your human-reviewed submission package</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{deliverable.reviewerNotes}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {deliverable.review.findings.map((finding) => (
            <article key={finding.id} className="rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{finding.section} · {finding.severity} risk</p>
              <h3 className="mt-2 font-semibold text-slate-950">{finding.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{finding.explanation}</p>
              <p className="mt-3 text-sm text-slate-700"><span className="font-semibold">Customer may ask: </span>{finding.likelyCustomerQuestion}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {finding.factsNeeded.map((fact) => <li key={fact}>{fact}</li>)}
              </ul>
            </article>
          ))}
        </div>
        {deliverable.rewrites.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-950">Fact-safe English rewrites</h3>
            <div className="mt-3 space-y-3">
              {deliverable.rewrites.map((rewrite, index) => (
                <div key={`${rewrite.section}-${index}`} className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-semibold text-slate-950">{rewrite.section}</p>
                  <p className="mt-1">{rewrite.suggestedEnglish}</p>
                  {rewrite.requiredPlaceholders.length > 0 && <p className="mt-2 text-amber-800">Verified facts still required: {rewrite.requiredPlaceholders.join("; ")}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href={`/api/rejection-reviews/${encodeURIComponent(token)}/export`} className={buttonVariants({ size: "lg" })}><Download className="size-4" /> Download DOCX review package</a>
          <Button variant="outline" onClick={requestRefund} disabled={loading || refundRequested}>
            {refundRequested ? "Refund request received" : "Request a refund"}
          </Button>
          <Link href="/refund-policy" className="text-xs text-slate-500 underline">Refund policy</Link>
        </div>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      </section>
    )
  }

  if (purchase?.deliveryStatus === "in_progress") {
    return (
      <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 sm:p-8" aria-live="polite">
        <p className="text-sm font-semibold text-indigo-700">Payment confirmed</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your 24-hour Deep Review is in progress</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">The initial scan is being checked by a person before release. This page will show the reviewed findings and DOCX package when delivery is marked ready.</p>
        <Button className="mt-5" variant="outline" onClick={() => void loadPurchase()}>Check delivery status</Button>
      </section>
    )
  }

  if (purchase?.deliveryStatus === "revoked") {
    return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">Full access is not active because this order was refunded, disputed, cancelled, or failed.</section>
  }

  return (
    <section className="mt-6 rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10"><LockKeyhole className="size-5" aria-hidden="true" /></span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-indigo-300">Concierge pilot</p>
          <h2 className="mt-1 text-2xl font-semibold">24-hour Deep Review — $99</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Automated initial checks plus internal human review before delivery. Includes section-by-section gaps, evidence and validation risks, likely customer questions, fact-safe English rewrites, and a downloadable DOCX package.</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">One report · one-time purchase · no subscription · no guarantee of customer acceptance</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={startCheckout} disabled={loading} className="bg-white text-slate-950 hover:bg-slate-100">
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {purchase?.checkoutUrl
                ? "Continue secure checkout"
                : signedIn
                  ? "Buy the 24-hour Deep Review"
                  : "Sign in and buy the Deep Review"}
            </Button>
            <Link href="/refund-policy" className="text-xs text-slate-400 underline">Refund and access policy</Link>
          </div>
          {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  )
}
