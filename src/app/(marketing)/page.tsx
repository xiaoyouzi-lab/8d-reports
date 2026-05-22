import Link from "next/link"
import { Car, Check, Cpu, Factory, Heart, Plane, X } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckoutButton } from "@/components/CheckoutButton"

const industries = [
  { name: "Automotive", desc: "IATF 16949 compliant", icon: Car },
  { name: "Electronics", desc: "IPC-A-610 ready", icon: Cpu },
  { name: "Medical Device", desc: "ISO 13485 aligned", icon: Heart },
  { name: "Aerospace", desc: "AS9100 compatible", icon: Plane },
  { name: "General Manufacturing", desc: "ISO 9001 ready", icon: Factory },
]

const painPoints = [
  "Manual data entry across multiple Excel sheets",
  "No version control — who changed what and when?",
  "Collaboration means emailing files back and forth",
  "Formatting takes longer than problem-solving",
]

const solutions = [
  "Structured D0-D8 workflow guides every step",
  "Built-in audit trail with timestamps and roles",
  "Real-time team collaboration in the cloud",
  "One-click PDF export, always perfectly formatted",
]

const steps = [
  {
    number: "01",
    title: "Create & document",
    description:
      "Start a new 8D report with guided prompts. Describe the problem, attach photos, and define your team — all in a structured workflow.",
  },
  {
    number: "02",
    title: "Analyze & complete",
    description:
      "Work through D0 to D8 with built-in tools for root cause analysis, containment actions, and corrective measures. Collaborate with your team in real time.",
  },
  {
    number: "03",
    title: "Export & share",
    description:
      "Generate a professional PDF report with one click. Share it with customers, auditors, or your quality management system — always audit-ready.",
  },
]

const faqs = [
  {
    q: "What is 8D problem-solving?",
    a: "8D (Eight Disciplines) is a structured problem-solving methodology used in manufacturing and engineering to identify, correct, and eliminate recurring problems. It covers everything from team formation (D1) to congratulating the team (D8).",
  },
  {
    q: "Is this just another spreadsheet template?",
    a: "No. 8D Reports is a full SaaS application with structured workflows, team collaboration, audit trails, and one-click PDF exports. It replaces your Excel template entirely.",
  },
  {
    q: "Can I export to PDF?",
    a: "Yes. Both Free and Pro plans include one-click PDF export with professional formatting suitable for customer submissions and quality audits.",
  },
  {
    q: "How is my data secured?",
    a: "All data is encrypted in transit and at rest. We use Neon serverless Postgres and Cloudflare R2 for secure, scalable storage. You own your data — export it anytime.",
  },
  {
    q: "What happens when I hit the 5-report limit?",
    a: "On the Free plan, you can create up to 5 reports lifetime. After that, upgrade to Pro for unlimited reports. Your existing reports remain accessible and exportable.",
  },
  {
    q: "Do you support teams with multiple users?",
    a: "The Pro plan includes team collaboration features. You can invite team members, assign roles, and work on 8D reports together in real time.",
  },
]

export default function LandingPage() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6">
              <Badge
                variant="secondary"
                className="border-[#4F46E5]/20 bg-[#4F46E5]/10 text-[#4F46E5]"
              >
                Now in public beta
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Professional 8D reports.
              <br />
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                No spreadsheets.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Create, manage, and export 8D problem-solving reports directly
              from the factory floor. Structured workflows, real-time
              collaboration, and audit-ready PDFs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 px-6 bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-base"
                )}
              >
                Start free — 5 reports
              </Link>
              <Link
                href="#comparison"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-6 text-base"
                )}
              >
                See how it works
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  value: "D0–D8",
                  label: "Complete workflow, every step covered",
                  mono: true,
                },
                {
                  value: "<30s",
                  label: "to your first report",
                  mono: true,
                },
                {
                  value: "PDF",
                  label: "one-click export, always audit-ready",
                  mono: true,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div
                    className={cn(
                      "text-2xl font-bold text-foreground",
                      metric.mono &&
                        "font-mono"
                    )}
                  >
                    {metric.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#4F46E5]/5 blur-3xl" />
        </div>
      </section>

      {/* Industries */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Built for quality teams across industries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3"
              >
                <industry.icon className="h-5 w-5 shrink-0 text-[#4F46E5]" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {industry.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {industry.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What changes when you stop using spreadsheets for 8D
            </h2>
            <p className="mt-4 text-muted-foreground">
              The difference between fighting your tools and letting them work
              for you.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {/* Old way */}
            <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 p-6 sm:p-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                The old way
              </h3>
              <ul className="mt-6 space-y-4">
                {painPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <X className="h-3 w-3" />
                    </span>
                    <span className="text-sm text-foreground/70">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With 8D Reports */}
            <div className="rounded-xl border border-[#059669]/20 bg-[#059669]/5 p-6 sm:p-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#059669]">
                With 8D Reports
              </h3>
              <ul className="mt-6 space-y-4">
                {solutions.map((solution) => (
                  <li key={solution} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#059669]/15 text-[#059669]">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm text-foreground/80">
                      {solution}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three steps from problem to professional report.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-border bg-card p-6"
              >
                <span className="font-mono text-3xl font-bold text-muted-foreground/30">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start for free. Upgrade when you need more.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl gap-6 lg:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-foreground">
                  $0
                </span>
                <span className="text-sm text-muted-foreground">/forever</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                5 lifetime reports, perfect for evaluation.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "5 reports included",
                  "Complete D0–D8 workflow",
                  "PDF export",
                  "Basic templates",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2.5 text-sm text-foreground/80"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-8 w-full h-11"
                )}
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-[#4F46E5] bg-card p-8 shadow-[0_0_24px_rgba(79,70,229,0.12)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="border-[#4F46E5]/30 bg-[#4F46E5] text-white">
                  Recommended
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-foreground">
                  $9.99
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-1 text-sm text-[#059669] font-medium">
                or $79/year — save 34%
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Unlimited reports for quality professionals.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited reports",
                  "Everything in Free",
                  "Team collaboration",
                  "Custom templates",
                  "Audit trail & version history",
                  "Priority support",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2.5 text-sm text-foreground/80"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2">
                <CheckoutButton
                  planType="monthly"
                  variant="default"
                  size="lg"
                  className="w-full h-11 bg-[#4F46E5] hover:bg-[#4F46E5]/90"
                >
                  $9.99 / month
                </CheckoutButton>
                <CheckoutButton
                  planType="yearly"
                  variant="outline"
                  size="lg"
                  className="w-full h-11 border-[#4F46E5]/30 text-[#059669] hover:bg-[#059669]/5"
                >
                  $79 / year — save 34%
                </CheckoutButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial placeholder — enable when customer stories are available */}
      <section className="border-y border-border bg-muted/10 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-lg text-muted-foreground">
            Customer stories coming soon
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about 8D Reports.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border bg-muted/20 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Built on trusted infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["Vercel", "Neon", "Cloudflare R2", "Creem"].map((name) => (
              <span
                key={name}
                className="text-lg font-bold text-muted-foreground/40"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to replace your Excel template?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Start creating professional 8D reports in minutes. No credit card
            required.
          </p>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "mt-8 h-11 px-8 bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-base"
            )}
          >
            Start free — 5 reports
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 8D Reports. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "mailto:support@8dreports.com" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
