import Link from "next/link"
import { Check } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckoutButton } from "@/components/CheckoutButton"
import { cn } from "@/lib/utils"

const freeFeatures = [
  "5 reports included",
  "Complete D0–D8 workflow",
  "PDF export with watermark",
  "Basic title/status search",
]

export default function PricingPage() {
  return (
    <div className="font-sans">
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-muted-foreground">
              Start for free. Upgrade when you need more.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl gap-6 lg:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h2 className="text-lg font-semibold text-foreground">Free</h2>
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
                {freeFeatures.map((feat) => (
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
                href="/login"
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
              <h2 className="text-lg font-semibold text-foreground">Pro</h2>
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
                <li className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                  Unlimited reports
                </li>
                <li className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                  Remove PDF watermark
                </li>
                <li className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                  Word export
                </li>
                <li className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                  Company logo on exports
                </li>
                <li className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className="h-4 w-4 shrink-0 text-[#059669]" />
                  Deep historical 8D search
                </li>
                <li className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Check className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>AI report drafting interest list <span className="text-[10px] text-amber-600 font-normal">(coming soon)</span></span>
                </li>
              </ul>
              <div className="mt-6 space-y-2">
                <CheckoutButton
                  planType="monthly"
                  className="w-full h-11 bg-[#4F46E5] hover:bg-[#4F46E5]/90"
                >
                  $9.99 / month
                </CheckoutButton>
                <CheckoutButton
                  planType="yearly"
                  variant="outline"
                  className="w-full h-11 border-[#4F46E5]/30 text-[#059669] hover:bg-[#059669]/5"
                >
                  $79 / year — save 34%
                </CheckoutButton>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
