import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { FileDown, ShieldCheck, Wrench } from "lucide-react"
import { AutoCheckout } from "@/components/AutoCheckout"
import { PrimaryCTA, TrackedCheckoutButton } from "@/components/marketing/MarketingActions"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { PlanCard } from "@/components/marketing/PlanCard"
import { siteUrl, socialOpenGraphImage } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "Pricing: Free, Pro, Team, and Single Export",
  description:
    "Start with 3 free reports. Upgrade to Pro for formal personal delivery, Team for shared control, or unlock one selected report with single export.",
  alternates: { canonical: `${siteUrl}/pricing` },
  openGraph: {
    title: "Pricing: Free, Pro, Team, and Single Export",
    description:
      "Free, Pro, Team, and single report export options for customer-ready 8D reports.",
    url: `${siteUrl}/pricing`,
    type: "website",
    images: [socialOpenGraphImage],
  },
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "Pricing", href: `${siteUrl}/pricing` },
]

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Evaluate the workflow and complete up to 3 lifetime reports.",
    features: [
      "3 lifetime reports",
      "D0-D8 editor",
      "Attachments",
      "View-only sharing",
      "Watermarked PDF",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "month",
    description: "For individual quality engineers who deliver reports regularly.",
    recommended: true,
    features: [
      "Unlimited personal reports",
      "PDF without watermark",
      "Word and Excel export",
      "Company logo",
      "Editable sharing",
      "Deep historical search",
    ],
  },
  {
    name: "Team",
    price: "$99",
    period: "month",
    description: "For small teams that need shared report control.",
    features: [
      "Everything in Pro",
      "5 seats",
      "Shared workspace",
      "Owner / Editor / Viewer roles",
      "Approval status, report locking, and revisions",
      "Activity log",
    ],
  },
]

const comparisonRows = [
  ["Reports", "3 lifetime", "Unlimited personal", "Shared workspace"],
  ["PDF export", "Watermarked", "No watermark", "No watermark"],
  ["Word and Excel", "Single export only", "Included", "Included"],
  ["Sharing", "View-only", "Editable", "Editable with roles"],
  ["Team controls", "—", "—", "Roles, approval, locking"],
]

const billingFaqs = [
  {
    question: "Do I need a credit card for Free?",
    answer: "No. Free starts with 3 lifetime reports and no credit card requirement.",
  },
  {
    question: "What happens after I use 3 reports?",
    answer:
      "Existing reports remain accessible. Creating more reports requires Pro or Team, while one selected report can be unlocked with single export.",
  },
  {
    question: "What does single export unlock?",
    answer:
      "Single export is $4.99 for one selected report and unlocks no-watermark PDF, Word, and Excel for that report.",
  },
  {
    question: "Can I cancel a subscription?",
    answer:
      "Contact support for cancellation or billing changes. Subscription status is updated through the billing provider and reflected in the product after the billing event is processed.",
  },
  {
    question: "Does Team include enterprise procurement features?",
    answer:
      "Team is a lightweight shared 8D workspace. Review Security or contact us before broader enterprise rollout requirements.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: billingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

export default function PricingPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start with 3 free reports. Pay when you need formal delivery or team control.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Free is for evaluation, Pro is for regular personal delivery, and
              Team is for a shared quality workspace with review controls.
            </p>
          </div>

          <Suspense fallback={null}>
            <AutoCheckout />
          </Suspense>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                recommended={plan.recommended}
              >
                {plan.name === "Free" ? (
                  <PrimaryCTA
                    href="/signup"
                    page="pricing"
                    location="free_plan"
                    variant="secondary"
                    className="w-full"
                    eventName="pricing_plan_clicked"
                    eventData={{ plan: "free" }}
                  >
                    Start free
                  </PrimaryCTA>
                ) : plan.name === "Pro" ? (
                  <TrackedCheckoutButton
                    plan="pro"
                    planType="pro_monthly"
                    className="h-11 w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Start Pro monthly
                  </TrackedCheckoutButton>
                ) : (
                  <TrackedCheckoutButton
                    plan="team"
                    planType="team_monthly"
                    className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
                  >
                    Start Team monthly
                  </TrackedCheckoutButton>
                )}
              </PlanCard>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            title="Single report export"
            description="Use this when you only need one formal deliverable and do not need ongoing Pro or Team features."
          />
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-5">
            <div className="flex gap-3">
              <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
              <div>
                <h2 className="text-lg font-semibold text-indigo-950">
                  $4.99 unlocks one selected report
                </h2>
                <ul className="mt-4 grid gap-2 text-sm text-indigo-900 sm:grid-cols-3">
                  <li>no-watermark PDF</li>
                  <li>Word</li>
                  <li>Excel</li>
                </ul>
                <p className="mt-4 text-sm leading-6 text-indigo-900">
                  Single export is started from a report export flow so the
                  selected report is clear.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-y border-slate-200 bg-slate-50">
        <SectionHeader
          title="Compact comparison"
          description="The main difference is when you need formal exports, reusable history, or team control."
        />
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[720px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-950">Feature</th>
                <th className="px-4 py-3 font-semibold text-slate-950">Free</th>
                <th className="px-4 py-3 font-semibold text-slate-950">Pro</th>
                <th className="px-4 py-3 font-semibold text-slate-950">Team</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row[0]} className="border-b border-slate-100 last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${row[0]}-${cellIndex}`} className="px-4 py-3 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeader
          title="Professional Services"
          description="Optional help for teams that need their template and workflow configured before rollout."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Wrench,
              title: "Template Setup",
              price: "From $499",
              text: "Convert your customer-specific 8D format into a practical setup path.",
              href: "/custom-8d-template-setup",
            },
            {
              icon: ShieldCheck,
              title: "Team Launch",
              price: "From $999",
              text: "Configure the workspace, roles, first report, and team training.",
              href: "/team-launch",
            },
          ].map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <service.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {service.title}
              </h3>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-950">
                {service.price}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{service.text}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-600">
          For security, data, and rollout questions, review{" "}
          <Link href="/security" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Security
          </Link>
          .
        </p>
      </Section>

      <Section className="border-t border-slate-200 bg-slate-50">
        <SectionHeader title="Billing FAQ" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {billingFaqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}
