import type { Metadata } from "next"
import Link from "next/link"
import { Lock, ShieldCheck, Trash2, UploadCloud } from "lucide-react"

export const metadata: Metadata = {
  title: "Security and Data Privacy | 8D Reports",
  description:
    "How 8D Reports handles report data, attachments, AI processing, sharing links, account deletion, and customer-facing quality documents.",
  alternates: {
    canonical: "https://www.8d-reports.com/security",
  },
}

const sections = [
  {
    icon: ShieldCheck,
    title: "Where report data is stored",
    text: "8D report text, dates, status, and account records are stored in the application database. File attachments, company logos, template files, and signature images are stored in object storage.",
  },
  {
    icon: Lock,
    title: "Encryption and access",
    text: "The production site is served over HTTPS. Reports require account access unless you intentionally create a share link. Share links can be revoked from the report sharing dialog.",
  },
  {
    icon: UploadCloud,
    title: "AI processing",
    text: "Report content is sent to DeepSeek only when a user actively runs an AI feature such as report review, draft generation, or template evaluation. Report data is not used to train 8D Reports models.",
  },
  {
    icon: Trash2,
    title: "Delete and export",
    text: "Users can export reports and attachments. Account or data deletion requests can be sent to support, and revoked share links no longer expose the report.",
  },
]

export default function SecurityPage() {
  return (
    <div className="bg-white font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Security / Data Privacy
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Clear data handling for customer-facing 8D reports.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Quality reports may contain customer, supplier, product, batch, defect, and evidence information.
            This page explains how 8D Reports handles that data before you use the product for paid delivery.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <section.icon className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Important AI and signature notes
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              AI features are optional. They are designed to help draft or review wording, not to approve reports,
              certify compliance, or replace a qualified quality owner.
            </p>
            <p>
              Uploaded signature images are used for report presentation in PDF, Word, and shared views. They are not
              a legal electronic signature system.
            </p>
            <p>
              If your company requires SOC2, SSO, data residency commitments, or formal DPA terms, contact us before
              using the product for regulated or contractual workflows.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Need data deletion or export help?
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Contact <a href="mailto:19857345237@163.com" className="font-medium text-indigo-600">19857345237@163.com</a> with your account email and request details.
          </p>
          <Link href="/privacy" className="mt-5 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Read the privacy policy
          </Link>
        </div>
      </section>
    </div>
  )
}
