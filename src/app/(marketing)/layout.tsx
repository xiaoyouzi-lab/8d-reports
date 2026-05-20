"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { LangSwitcher } from "@/components/LangSwitcher"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "#comparison", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#", label: "Docs" },
]

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
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
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangSwitcher />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" })
              )}
            >
              {t("auth.signIn")}
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-[#4F46E5] hover:bg-[#4F46E5]/90"
              )}
            >
              {t("marketing.ctaStart")}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
