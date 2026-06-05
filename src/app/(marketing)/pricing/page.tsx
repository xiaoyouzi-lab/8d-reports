import Link from "next/link"
import { Suspense } from "react"
import { ArrowRight, Check, FileDown, Wrench } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckoutButton } from "@/components/CheckoutButton"
import { AutoCheckout } from "@/components/AutoCheckout"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "Try the full D0-D8 workflow and create up to 3 lifetime reports.",
    features: [
      "3 lifetime reports",
      "Complete D0-D8 editor",
      "PDF export with watermark",
      "Basic dashboard search",
      "View-only share links",
    ],
    cta: (
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-8 h-11 w-full")}
      >
        Get started
      </Link>
    ),
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For individual quality engineers who deliver 8D reports regularly.",
    recommended: true,
    features: [
      "Unlimited personal reports",
      "No-watermark PDF export",
      "Word export",
      "Company logo on exports",
      "Editable share links",
      "Deep historical 8D search",
    ],
    cta: (
      <CheckoutButton
        planType="pro_monthly"
        className="mt-8 h-11 w-full bg-[#4F46E5] hover:bg-[#4F46E5]/90"
      >
        Start Pro monthly
      </CheckoutButton>
    ),
  },
  {
    name: "Team",
    price: "$99",
    period: "/month",
    description: "For small quality teams that need a shared report workspace.",
    features: [
      "Everything in Pro",
      "5 seats included",
      "Team report workspace",
      "Owner / Editor / Viewer roles",
      "Approval status, report locking, and revisions",
      "Activity log for report changes and delivery",
      "Shared deep search across team reports",
      "Owner-managed team access and formal exports",
    ],
    cta: (
      <CheckoutButton
        planType="team_monthly"
        className="mt-8 h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
      >
        Start Team monthly
      </CheckoutButton>
    ),
  },
]

const addOns = [
  {
    icon: FileDown,
    title: "Single report export",
    price: "$4.99/report",
    text: "Unlock no-watermark PDF and Word export for one report only. It does not unlock unlimited personal reports, logo upload, editable sharing, or deep search.",
  },
  {
    icon: Wrench,
    title: "Enterprise template customization",
    price: "From $499",
    text: "Custom 8D format, customer-specific fields, branded export layout, and supplier-facing template setup.",
    href: "/custom-8d-template-setup",
  },
  {
    icon: Wrench,
    title: "Team Launch",
    price: "From $999",
    text: "We configure your template, Team workspace, roles, first real 8D report, and team training.",
    href: "/team-launch",
  },
]

const teamTrustItems = [
  "Owner-managed members with 5 seats included",
  "Owner / Editor / Viewer roles with owner-controlled approval and unlock",
  "View-only and editable share links can be revoked",
  "Report locking, revisions, and a lightweight activity log",
  "Security / Data Privacy page explains storage, AI handling, deletion, and sharing",
  "Enterprise requests such as DPA, SSO, audit-log exports, and support SLA should be scoped before company-wide rollout",
]

export default function PricingPage() {
  return (
    <div className="font-sans">
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pricing that matches how 8D reports are delivered
            </h1>
            <p className="mt-4 text-muted-foreground">
              Free is for evaluation. Pro is for regular delivery. Team is for a shared quality workspace. One-time export is available when you only need one customer-ready report.
            </p>
          </div>

          <Suspense fallback={null}>
            <AutoCheckout />
          </Suspense>

          <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-xl border bg-card p-8",
                  plan.recommended
                    ? "border-2 border-[#4F46E5] shadow-[0_0_24px_rgba(79,70,229,0.12)]"
                    : "border-border",
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="border-[#4F46E5]/30 bg-[#4F46E5] text-white">
                      Recommended
                    </Badge>
                  </div>
                )}
                <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.cta}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-semibold text-indigo-950">Need help launching the workflow?</p>
              <p className="mt-1 text-sm text-indigo-700">We convert your template, configure roles, and help complete the first customer-ready report.</p>
            </div>
            <Link href="/team-launch" className={cn(buttonVariants({ size: "lg" }), "shrink-0 bg-indigo-600 text-white hover:bg-indigo-700")}>
              Book Team Launch
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {addOns.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 font-mono text-xl font-semibold text-foreground">{item.price}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    {"href" in item && item.href ? (
                      <Link
                        href={item.href}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Learn about setup
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
            Team access is implemented as a shared team workspace with owner-managed members. Single report export unlocks only the selected report.
            {" "}
            <Link href="/security" className="font-medium text-indigo-600 hover:text-indigo-700">Security and data privacy</Link>
            {" · "}
            <Link href="/8d-report-review-service" className="font-medium text-indigo-600 hover:text-indigo-700">8D report review service</Link>
            {" · "}
            <Link href="/api/sample-reports/automotive" className="font-medium text-indigo-600 hover:text-indigo-700">Download sample PDF</Link>
          </p>

          <div className="mx-auto mt-12 max-w-5xl rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  What Team means today
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Team is suitable for small quality teams that need a shared report workspace now. Larger companies can evaluate the workflow, but procurement requirements such as DPA, SSO, audit exports, and formal support terms should be discussed before broad deployment.
                </p>
                <Link href="/security" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Review security details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {teamTrustItems.map((item) => (
                  <li key={item} className="flex gap-2 rounded-lg bg-white p-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
