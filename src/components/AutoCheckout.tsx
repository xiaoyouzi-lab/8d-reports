"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"

function isPlanType(value: string | null): value is "monthly" | "yearly" {
  return value === "monthly" || value === "yearly"
}

export function AutoCheckout() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planType = searchParams.get("checkout")
  const { data: session, isPending } = authClient.useSession()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isPlanType(planType) || isPending || startedRef.current) return

    if (!session?.user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/pricing?checkout=${planType}`)}`)
      return
    }

    startedRef.current = true

    async function startCheckout() {
      try {
        trackEvent("checkout_started", { planType, source: "post_login_pricing" })
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planType }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.error || "Failed to create checkout session")
        }
        if (!data?.checkout_url) {
          throw new Error("Checkout URL missing")
        }
        window.location.href = data.checkout_url
      } catch (error) {
        startedRef.current = false
        toast.error(error instanceof Error ? error.message : "Checkout failed")
        router.replace("/pricing")
      }
    }

    void startCheckout()
  }, [isPending, planType, router, session?.user])

  if (!isPlanType(planType)) return null

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
      Preparing secure checkout...
    </div>
  )
}
