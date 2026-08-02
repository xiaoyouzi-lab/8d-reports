import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  alternates: { canonical: "https://www.8d-reports.com/privacy" },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
          <p><strong>Last updated:</strong> August 2, 2026</p>
          
          <h2>1. Information We Collect</h2>
          <p>When you create an account, we collect your name, email address, and authentication credentials. When you use 8D Reject Check or the report editor, we process the report text and files you choose to provide.</p>

          <h2>2. 8D Reject Check document handling</h2>
          <p>For the Reject Check workflow, TXT and DOCX files are parsed on the server. The original upload is not written to Cloudflare R2; bounded extracted text, a document hash, the free result, and the complete result are stored in Neon so the task can be resumed and, after purchase, delivered.</p>
          <p>The anonymous task link expires after 30 days. Link expiry is an access control and is not a promise of immediate database deletion. You may request earlier deletion using the contact address below, subject to transaction, fraud-prevention, dispute, and legal record requirements.</p>
          <p>If you purchase the 24-hour Deep Review, an internal reviewer may access the bounded extracted text and initial findings only to check the result and prepare the promised delivery. The reviewer is instructed not to add unsupported facts.</p>
          
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to provide the requested review, authenticate access, process one-time purchases or subscriptions, prevent abuse, deliver exports, handle refunds, and support the service. We do not sell report data.</p>
          <p>When AI-enhanced analysis or rewriting is available, bounded report text may be sent to the configured AI provider solely to produce that task result. Deterministic rules run independently, and missing facts must not be presented as facts.</p>
          
          <h2>4. Data Storage & Security</h2>
          <p>Application data is stored in Neon Postgres. Attachments used by the existing report editor may be stored in Cloudflare R2. We use encrypted network connections and access controls appropriate to the service. No internet service can guarantee absolute security, so do not submit information that is not needed for the review.</p>
          
          <h2>5. Cookies and funnel measurement</h2>
          <p>We use essential session storage for authentication and an anonymous review-session identifier for funnel measurement. Reject Check funnel records include event name, pseudonymous session hash, traffic source, task/order references, actor category, timing, and safe failure codes. They do not include report text, uploaded filenames, confidential document content, or complete AI output.</p>
          
          <h2>6. Payment providers and necessary processors</h2>
          <p>Payment and tax information is handled by the checkout provider acting as merchant of record. We store provider order and transaction identifiers, amount, currency, status, and refund state for entitlement and reconciliation; we do not store full card details.</p>

          <h2>7. Your Rights</h2>
          <p>You can download available outputs and request access, correction, or deletion of personal data by contacting support. Rights and retention exceptions depend on applicable law and necessary transaction records.</p>
          
          <h2>8. Contact</h2>
          <p>For privacy-related inquiries, contact us at 19857345237@163.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
