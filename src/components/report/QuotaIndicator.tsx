"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DEFAULT_QUOTA_TOTAL = 5

interface QuotaData {
  total: number
  used: number
}

function getQuotaKey(userId: string): string {
  return `quota-${userId}`
}

function loadQuota(userId: string): QuotaData {
  if (typeof window === "undefined") return { total: DEFAULT_QUOTA_TOTAL, used: 0 }
  try {
    const raw = localStorage.getItem(getQuotaKey(userId))
    if (!raw) return { total: DEFAULT_QUOTA_TOTAL, used: 0 }
    const data = JSON.parse(raw)
    return {
      total: data.total ?? DEFAULT_QUOTA_TOTAL,
      used: data.used ?? 0,
    }
  } catch {
    return { total: DEFAULT_QUOTA_TOTAL, used: 0 }
  }
}

export function saveQuota(userId: string, data: QuotaData) {
  if (typeof window === "undefined") return
  localStorage.setItem(getQuotaKey(userId), JSON.stringify(data))
}

export function incrementQuotaUsed(userId: string) {
  const quota = loadQuota(userId)
  quota.used = Math.min(quota.used + 1, quota.total)
  saveQuota(userId, quota)
}

interface QuotaIndicatorProps {
  userId: string
  isPro: boolean
}

export function QuotaIndicator({ userId, isPro }: QuotaIndicatorProps) {
  const [mounted, setMounted] = useState(false)
  const [quota, setQuota] = useState<QuotaData>({ total: DEFAULT_QUOTA_TOTAL, used: 0 })

  useEffect(() => {
    setMounted(true)
    if (!isPro) {
      setQuota(loadQuota(userId))
    }
  }, [userId, isPro])

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

  const remaining = Math.max(quota.total - quota.used, 0)
  const percentUsed = quota.total > 0 ? Math.round((quota.used / quota.total) * 100) : 0
  const isExhausted = remaining === 0

  if (!mounted) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <p className="text-sm font-medium text-indigo-900">
          Free Quota
        </p>
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
          <Link href="/pricing">
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
