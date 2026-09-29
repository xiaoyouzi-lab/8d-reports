"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const t = useTranslations("quota")
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    try {
      trackEvent("billing_portal_clicked", { source: "dashboard" })
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) throw new Error(data?.error || t("billingPortalError"))
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("billingPortalError"))
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={openPortal} disabled={loading} className={className}>
      {loading ? t("opening") : t("manageSubscription")}
    </Button>
  )
}
