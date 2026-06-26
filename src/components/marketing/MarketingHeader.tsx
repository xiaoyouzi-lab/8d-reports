"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LogOut } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

const navLinks = [
  { href: "/#workflow", label: "Product", match: "/" },
  { href: "/sample-report", label: "Examples", match: "/sample-report" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
]

export function MarketingHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true)
    }, isPending ? 1200 : 0)
    return () => clearTimeout(timer)
  }, [isPending])

  const loggedIn = !!session

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
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const user = session?.user
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"
  const isActive = (link: (typeof navLinks)[number]) => {
    if (link.match === "/") return pathname === "/"
    const match = link.match || link.href
    return pathname === match || pathname.startsWith(`${match}/`)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "bg-background"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-sans font-semibold text-foreground"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5] text-xs font-bold text-white">
            8D
          </span>
          <span className="text-sm">8D Reports</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(link)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!ready ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "bg-[#4F46E5] hover:bg-[#4F46E5]/90"
                )}
              >
                <LayoutDashboard className="size-3.5" />
                Dashboard
              </Link>
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
                    <div className="px-2 py-1.5 text-xs">
                      <div className="font-medium text-foreground">{user?.name || "User"}</div>
                      <div className="text-xs font-normal text-muted-foreground">{user?.email || ""}</div>
                    </div>
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <a
                      href="/dashboard"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </a>
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => { authClient.signOut(); setMenuOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "bg-[#4F46E5] px-2 hover:bg-[#4F46E5]/90 sm:px-2.5"
                )}
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="border-t border-border/70 px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(link)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
