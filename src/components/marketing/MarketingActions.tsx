"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { CheckoutButton } from "@/components/CheckoutButton"
import { buttonVariants } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"
import type { CheckoutType } from "@/lib/plans"
import { cn } from "@/lib/utils"

type EventMetadata = Record<string, string | number | boolean | undefined>

export function TrackedLink({
  href,
  children,
  className,
  eventName = "marketing_cta_clicked",
  eventData = {},
  rel,
  target,
  download,
}: {
  href: string
  children: ReactNode
  className?: string
  eventName?: string
  eventData?: EventMetadata
  rel?: string
  target?: string
  download?: boolean
}) {
  return (
    <Link
      href={href}
      className={className}
      rel={rel}
      target={target}
      download={download}
      onClick={() =>
        trackEvent(eventName, {
          destination: href,
          ...eventData,
        })
      }
    >
      {children}
    </Link>
  )
}

export function PrimaryCTA({
  href,
  children,
  page,
  location,
  className,
  variant = "primary",
  showArrow = true,
  eventName = "marketing_cta_clicked",
  eventData = {},
}: {
  href: string
  children: ReactNode
  page: string
  location: string
  className?: string
  variant?: "primary" | "secondary" | "ghost"
  showArrow?: boolean
  eventName?: string
  eventData?: EventMetadata
}) {
  const styles = {
    primary:
      "h-11 bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700",
    secondary:
      "h-11 border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50",
    ghost:
      "h-11 px-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800",
  }

  return (
    <TrackedLink
      href={href}
      eventName={eventName}
      eventData={{ page, location, ...eventData }}
      className={cn(
        buttonVariants({
          variant: variant === "primary" ? "default" : variant === "secondary" ? "outline" : "ghost",
          size: "lg",
        }),
        styles[variant],
        className,
      )}
    >
      {children}
      {showArrow ? <ArrowRight className="h-4 w-4" /> : null}
    </TrackedLink>
  )
}

export function TrackedCheckoutButton({
  planType,
  children,
  className,
  plan,
}: {
  planType: CheckoutType
  children: ReactNode
  className?: string
  plan: string
}) {
  return (
    <span
      className="block"
      onClickCapture={() =>
        trackEvent("pricing_plan_clicked", {
          plan,
          planType,
          page: "pricing",
          location: "plan_card",
        })
      }
    >
      <CheckoutButton planType={planType} className={className}>
        {children}
      </CheckoutButton>
    </span>
  )
}

export function CopyTemplateButton({
  text,
  page,
  location,
  className,
}: {
  text: string
  page: string
  location: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-11 border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50",
        className,
      )}
      onClick={async () => {
        await navigator.clipboard?.writeText(text)
        trackEvent("marketing_cta_clicked", {
          page,
          location,
          destination: "clipboard",
          action: "copy_blank_template",
        })
      }}
    >
      Copy blank template
    </button>
  )
}

export function LoadingCTA({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {children}
    </span>
  )
}
