"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const DEFAULT_QUOTA_TOTAL = 5

interface QuotaData {
  total: number
  used: number
}

interface QuotaIndicatorProps {
  isPro: boolean
}

export function QuotaIndicator({ isPro }: QuotaIndicatorProps) {
  const [quota, setQuota] = useState<QuotaData>({ total: DEFAULT_QUOTA_TOTAL, used: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPro) {
      const timer = setTimeout(() => {
        fetch("/api/quota")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setQuota({ total: data.totalQuota ?? DEFAULT_QUOTA_TOTAL, used: data.usedQuota ?? 0 })
        })
        .catch(() => {})
        .finally(() => setLoading(false))
      }, 0)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(timer)
    }
  }, [isPro])

  const remaining = Math.max(quota.total - quota.used, 0)
  const percentUsed = quota.total > 0 ? Math.round((quota.used / quota.total) * 100) : 0
  const isExhausted = remaining === 0

  if (isPro) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <p className="text-sm font-medium text-emerald-900">
          Pro Plan — Unlimited reports
        </p>
        <p className="mt-0.5 text-xs text-emerald-700/80">
          You have unlimited reports and premium features.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <p className="text-sm font-medium text-indigo-900">Free Quota</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
          <div className="h-full w-0 rounded-full bg-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isExhausted
          ? "border-red-200 bg-red-50/50"
          : "border-indigo-200 bg-indigo-50/50"
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-sm font-medium",
            isExhausted ? "text-red-900" : "text-indigo-900"
          )}
        >
          {isExhausted
            ? "Quota exhausted"
            : `${quota.used} of ${quota.total} free reports used`}
        </p>
        {!isExhausted && (
          <span className="font-mono text-xs font-semibold tabular-nums text-indigo-600">
            {remaining} left
          </span>
        )}
      </div>

      <div
        className={cn(
          "mt-2 h-2 overflow-hidden rounded-full",
          isExhausted ? "bg-red-100" : "bg-indigo-100"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isExhausted ? "bg-red-500" : "bg-indigo-500"
          )}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {!isExhausted && (
        <p className="mt-1.5 text-xs text-indigo-700/80">
          Upgrade to Pro for unlimited reports and no watermarks.
        </p>
      )}

      {isExhausted && (
        <div className="mt-3">
          <p className="text-xs text-red-700/80">
            You have used all your free reports. Upgrade to Pro to create more reports.
          </p>
          <Link
            href="/pricing"
            onClick={() => {
              trackEvent("quota_limit_seen", { source: "quota_indicator" })
              trackEvent("upgrade_clicked", { source: "quota_indicator", plan: "free" })
            }}
          >
            <Button
              className="mt-2 w-full bg-indigo-600 text-white hover:bg-indigo-700"
              size="sm"
            >
              Upgrade to Pro
              <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
