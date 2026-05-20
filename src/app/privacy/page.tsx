import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
          <p><strong>Last updated:</strong> May 20, 2026</p>
          
          <h2>1. Information We Collect</h2>
          <p>When you create an account, we collect your name, email address, and authentication credentials. When you create 8D reports, we store the report data you provide including text, dates, and file attachments.</p>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use your information solely to provide the 8D Reports service — to display your reports, enable sharing, and process your subscription. We do not sell your data to third parties.</p>
          
          <h2>3. Data Storage & Security</h2>
          <p>Your data is stored on Neon (PostgreSQL) and Cloudflare R2 (file storage). All data is encrypted in transit (TLS 1.3) and at rest. Authentication uses industry-standard JWT tokens with HttpOnly, Secure, and SameSite cookies.</p>
          
          <h2>4. Cookies</h2>
          <p>We use essential cookies for authentication (session tokens) and language preferences. We do not use tracking or advertising cookies.</p>
          
          <h2>5. Your Rights</h2>
          <p>You can export your report data at any time (PDF/Word export). You can request account deletion by contacting support. Under GDPR, you have the right to access, rectify, and erase your personal data.</p>
          
          <h2>6. Contact</h2>
          <p>For privacy-related inquiries, contact us at privacy@8dreports.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
