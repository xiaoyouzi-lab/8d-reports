"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { BookOpen, LayoutDashboard, LogOut, PlusCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { QualityAgentFab } from "@/components/quality-agent/QualityAgentFab"
import { usePlan } from "@/lib/use-plan"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()
  const { plan } = usePlan((session?.user as Record<string, unknown> | undefined)?.plan)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [quotaLabel, setQuotaLabel] = useState("0/3")

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
          const total = data.totalQuota ?? 3
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
  const navItems = [
    { href: "/dashboard", label: t("dashboard.myReports"), icon: LayoutDashboard },
    { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
    { href: "/reports/new", label: "New Report", icon: PlusCircle },
  ]
  const navLinkClass = (href: string) => {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
    return [
      "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
      active
        ? "bg-indigo-50 text-indigo-700"
        : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
    ].join(" ")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                8D
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                8D Reports
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary app navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={plan === "pro" || plan === "team" ? "default" : "outline"}
              className="hidden sm:inline-flex"
            >
              {plan === "team" ? "Team · 5 seats" : plan === "pro" ? "Pro · Personal" : `Free · ${quotaLabel}`}
            </Badge>

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
                  className="absolute right-0 top-full z-[100] mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-white p-1 text-popover-foreground shadow-xl"
                >
                  <div className="min-w-0 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <div className="truncate font-medium text-foreground">{user?.name || "User"}</div>
                    <div className="truncate text-xs font-normal text-muted-foreground">{user?.email || ""}</div>
                  </div>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => { router.push("/dashboard"); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <LayoutDashboard className="size-4" />
                    {t("dashboard.myReports")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { router.push("/knowledge"); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <BookOpen className="size-4" />
                    Knowledge Base
                  </button>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => { authClient.signOut(); router.push("/login"); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav
          className="flex h-10 items-center gap-2 overflow-x-auto border-t border-border/40 px-4 md:hidden"
          aria-label="Primary app navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                <Icon className="size-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="flex-1">{children}</main>
      <QualityAgentFab locale={locale} />
    </div>
  )
}
