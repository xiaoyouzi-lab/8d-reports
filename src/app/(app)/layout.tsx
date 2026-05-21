"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { LayoutDashboard, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LangSwitcher } from "@/components/LangSwitcher"
import { QualityAgentFab } from "@/components/quality-agent/QualityAgentFab"
import { FeedbackButton } from "@/components/feedback/FeedbackButton"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [quotaLabel, setQuotaLabel] = useState("2/5")

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  useEffect(() => {
    if (!session) return
    fetch("/api/quota")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          const used = data.usedQuota ?? 0
          const total = data.totalQuota ?? 5
          setQuotaLabel(`${used}/${total}`)
        }
      })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const user = session.user
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"
  const plan = (user as Record<string, unknown>)?.plan as string || "free"

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                8D
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                8D Reports
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={plan === "pro" ? "default" : "outline"}
              className="hidden sm:inline-flex"
            >
              {plan === "pro" ? "Pro · Unlimited" : `Free · ${quotaLabel}`}
            </Badge>

            <LangSwitcher />

            <div className="relative">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-indigo-100 text-xs font-medium text-indigo-700">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                >
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <div className="font-medium text-foreground">{user?.name || "User"}</div>
                    <div className="text-xs font-normal text-muted-foreground">{user?.email || ""}</div>
                  </div>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => { router.push("/dashboard"); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <LayoutDashboard className="size-4" />
                    {t("dashboard.myReports")}
                  </button>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => { authClient.signOut(); router.push("/login"); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <QualityAgentFab locale={locale} />
      <FeedbackButton locale={locale} />
    </div>
  )
}
