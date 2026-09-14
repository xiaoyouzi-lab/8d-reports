"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    try {
      trackEvent("billing_portal_clicked", { source: "dashboard" })
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) throw new Error(data?.error || "Could not open the billing portal")
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the billing portal")
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={openPortal} disabled={loading} className={className}>
      {loading ? "Opening..." : "Manage subscription"}
    </Button>
  )
}
