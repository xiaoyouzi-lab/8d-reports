import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  alternates: { canonical: "https://www.8d-reports.com/terms" },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
          <p><strong>Last updated:</strong> August 2, 2026</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>By using 8D Reports (&ldquo;the Service&rdquo;), you agree to these Terms of Service.</p>
          
          <h2>2. Service Description</h2>
          <p>8D Reports includes an existing report editor and 8D Reject Check, a pre-submission risk review for supplied 8D, SCAR, or corrective-action responses. The Service is provided &ldquo;as is&rdquo; without warranties.</p>

          <h2>3. 24-hour Deep Review</h2>
          <p>The current Concierge pilot price is $99 for one review task. Automated initial checks are reviewed by a person before the result is released, normally within 24 hours of confirmed payment. Delivery includes the reviewed analysis, modification advice, fact-supported English rewrites, and a DOCX package for that task. A purchase does not create a subscription and does not unlock another task.</p>
          <p>The review identifies likely rejection risks from the material you supplied. It does not guarantee customer acceptance, certify compliance, confirm root cause, prove implementation or effectiveness, or replace qualified professional judgment. You must verify all facts and placeholders before submitting anything to a customer.</p>
          
          <h2>4. Existing Free, Pro, and Team Plans</h2>
          <p><strong>Free Plan:</strong> 3 lifetime reports with watermarked PDF export and basic search. <strong>Pro Plan:</strong> $19/month for individual use with unlimited personal reports, PDF export without watermark, Word export, company logo, editable share links, and deep historical search. Pro subscriptions auto-renew unless cancelled. <strong>Team Plan:</strong> $99/month includes 5 seats, a shared workspace, roles, approval status, report locking, revisions, and Activity Log.</p>
          
          <h2>5. User Responsibilities</h2>
          <p>You are responsible for the accuracy of report data you enter. You must not use the Service for illegal purposes. You retain all ownership rights to your report data.</p>
          
          <h2>6. Payment and Refunds</h2>
          <p>Payment is completed through the checkout provider. Payment alone records the order but does not expose an unreviewed draft; access begins when the reviewed package is marked delivered. Failed, cancelled, refunded, reversed, or disputed transactions do not retain paid access. The <Link href="/refund-policy">Refund Policy</Link> is incorporated into these terms.</p>

          <h2>7. Limitation of Liability</h2>
          <p>8D Reports shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.</p>
          
          <h2>8. Termination</h2>
          <p>You may stop using the Service at any time. We reserve the right to terminate accounts that violate these terms.</p>
          
          <h2>9. Contact</h2>
          <p>For legal inquiries, billing questions, or account support: 19857345237@163.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
