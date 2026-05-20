import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
          <p><strong>Last updated:</strong> May 20, 2026</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>By using 8D Reports (&ldquo;the Service&rdquo;), you agree to these Terms of Service.</p>
          
          <h2>2. Service Description</h2>
          <p>8D Reports is a SaaS application for creating, managing, and exporting 8D problem-solving reports. The Service is provided &ldquo;as is&rdquo; without warranties.</p>
          
          <h2>3. Free & Pro Plans</h2>
          <p><strong>Free Plan:</strong> 5 lifetime reports with PDF export. <strong>Pro Plan:</strong> $9.99/month or $79/year for unlimited reports, team collaboration, custom templates, and priority support. Pro subscriptions auto-renew unless cancelled.</p>
          
          <h2>4. User Responsibilities</h2>
          <p>You are responsible for the accuracy of report data you enter. You must not use the Service for illegal purposes. You retain all ownership rights to your report data.</p>
          
          <h2>5. Limitation of Liability</h2>
          <p>8D Reports shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.</p>
          
          <h2>6. Termination</h2>
          <p>You may stop using the Service at any time. We reserve the right to terminate accounts that violate these terms.</p>
          
          <h2>7. Contact</h2>
          <p>For legal inquiries: legal@8dreports.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
