import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Refund Policy | 8D Reject Check",
  alternates: { canonical: "https://www.8d-reports.com/refund-policy" },
}

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Refund Policy</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none space-y-4 pt-6">
          <p><strong>Last updated:</strong> August 2, 2026</p>

          <h2>24-hour Deep Review</h2>
          <p>
            This is a one-time digital purchase for one review task, not a subscription. You may request a refund within seven calendar days of payment by emailing 19857345237@163.com with the order ID and the reason the review did not meet the stated scope.
          </p>
          <p>
            A full refund is available when the reviewed package is not delivered within 24 hours of confirmed payment, cannot be opened or downloaded, or a service failure materially prevents delivery of the promised section-by-section analysis. Other timely requests are reviewed fairly based on the delivered result and the stated product scope.
          </p>

          <h2>What happens after a refund</h2>
          <p>
            Any full or partial refund, payment reversal, or dispute revokes access to the complete review and download package. Free preliminary results remain subject to their normal access period. Refunded purchases do not count as revenue.
          </p>

          <h2>Processing time</h2>
          <p>
            We aim to respond within three business days. Approved refunds are submitted to the payment provider promptly; the issuing bank may take five to ten business days to show the funds. Statutory consumer rights are not limited by this policy.
          </p>

          <h2>Scope limitations</h2>
          <p>
            A difference of professional opinion, or a customer later asking more questions, does not by itself prove that the service failed. The review identifies risks from the supplied material; it does not guarantee customer acceptance, certify compliance, confirm root cause, or prove corrective-action effectiveness.
          </p>

          <p>
            See also the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
