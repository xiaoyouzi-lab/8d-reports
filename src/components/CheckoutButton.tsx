"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { Loader2 } from "lucide-react"

export function CheckoutButton({
  planType,
  className,
  children,
  variant = "default",
  size = "lg",
}: {
  planType: "monthly" | "yearly"
  className?: string
  children: React.ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs"
}) {
  const [loading, setLoading] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  const handleClick = async () => {
    if (loading || isPending) return

    if (!session?.user) {
      trackEvent("upgrade_clicked", { source: "pricing", planType })
      router.push(`/login?callbackUrl=${encodeURIComponent(`/pricing?checkout=${planType}`)}`)
      return
    }

    setLoading(true)
    try {
      trackEvent("checkout_started", { planType })
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      })

      const session_data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(session_data?.error || "Failed to create checkout session")
      }

      if (session_data?.checkout_url) {
        window.location.href = session_data.checkout_url
        return
      }
      throw new Error("Checkout URL missing")
    } catch (err) {
      console.error("Checkout error:", err)
      toast.error(err instanceof Error ? err.message : "Checkout failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || isPending}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
